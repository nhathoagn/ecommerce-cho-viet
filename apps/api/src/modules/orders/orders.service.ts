import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, OrderStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CheckoutDto,
  CreateCouponDto,
  UpdateOrderStatusDto,
} from './orders.dto.js';

const orderInclude = {
  items: true,
  store: { select: { id: true, name: true, slug: true } },
  payment: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
};
const sellerTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  PAID: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PACKING, OrderStatus.CANCELLED],
  PACKING: [OrderStatus.SHIPPING],
  SHIPPING: [OrderStatus.DELIVERED],
  DELIVERED: [OrderStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  REFUND_REQUESTED: [OrderStatus.REFUNDED],
  REFUNDED: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Shipping address not found');
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
    if (!cart?.items.length) throw new BadRequestException('Cart is empty');
    const storeIds = new Set(cart.items.map((item) => item.product.storeId));
    if (storeIds.size !== 1)
      throw new BadRequestException('Checkout supports one store at a time');
    for (const item of cart.items)
      if (item.quantity > item.product.stock)
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}`,
        );
    const storeId = cart.items[0]!.product.storeId;
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    const coupon = dto.couponCode
      ? await this.validCoupon(dto.couponCode, storeId, subtotal)
      : null;
    const discount = coupon
      ? Math.min(
          subtotal,
          coupon.percentOff
            ? Math.floor((subtotal * coupon.percentOff) / 100)
            : Number(coupon.fixedAmountOff ?? 0),
        )
      : 0;
    const shipping = subtotal >= 500000 ? 0 : 30000;
    const total = subtotal - discount + shipping;

    return this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1)
          throw new BadRequestException(
            `Insufficient stock for ${item.product.name}`,
          );
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.SALE,
            quantity: -item.quantity,
            before: item.product.stock,
            after: item.product.stock - item.quantity,
            reason: 'Order checkout',
          },
        });
      }
      const order = await tx.order.create({
        data: {
          code: `CV-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
          buyerId: userId,
          storeId,
          subtotal: new Prisma.Decimal(subtotal),
          discountAmount: new Prisma.Decimal(discount),
          shippingAmount: new Prisma.Decimal(shipping),
          totalAmount: new Prisma.Decimal(total),
          shippingAddress: {
            recipientName: address.recipientName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            ward: address.ward,
            district: address.district,
            city: address.city,
            postalCode: address.postalCode,
          },
          couponCode: coupon?.code,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              unitPrice: item.product.price,
              quantity: item.quantity,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING_PAYMENT,
              note: 'Order created',
            },
          },
        },
        include: orderInclude,
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (coupon)
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      return order;
    });
  }

  buyerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { buyerId: userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
  async buyerOrder(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
  sellerOrders(sellerId: string) {
    return this.prisma.order.findMany({
      where: { store: { sellerId } },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    const cancellable = new Set<OrderStatus>([
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.CONFIRMED,
    ]);
    if (!cancellable.has(order.status))
      throw new BadRequestException('Order can no longer be cancelled');
    return this.changeStatusAndRestock(
      order.id,
      order.status,
      OrderStatus.CANCELLED,
      order.items,
      'Cancelled by buyer',
    );
  }

  async sellerUpdate(sellerId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id, store: { sellerId } },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!sellerTransitions[order.status].includes(dto.status))
      throw new BadRequestException(
        `Invalid transition ${order.status} → ${dto.status}`,
      );
    if (dto.status === OrderStatus.CANCELLED)
      return this.changeStatusAndRestock(
        order.id,
        order.status,
        dto.status,
        order.items,
        dto.note,
      );
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        statusHistory: { create: { status: dto.status, note: dto.note } },
      },
      include: orderInclude,
    });
  }

  async createCoupon(sellerId: string, dto: CreateCouponDto) {
    const store = await this.prisma.store.findUnique({ where: { sellerId } });
    if (!store) throw new ForbiddenException('Store required');
    if (
      (!dto.percentOff && !dto.fixedAmountOff) ||
      (dto.percentOff && dto.fixedAmountOff)
    )
      throw new BadRequestException('Choose percent or fixed discount');
    return this.prisma.coupon.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        storeId: store.id,
        percentOff: dto.percentOff,
        fixedAmountOff:
          dto.fixedAmountOff === undefined
            ? undefined
            : new Prisma.Decimal(dto.fixedAmountOff),
        minOrderAmount: new Prisma.Decimal(dto.minOrderAmount ?? 0),
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  private async validCoupon(code: string, storeId: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (
      !coupon ||
      coupon.storeId !== storeId ||
      !coupon.active ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      (coupon.maxUses && coupon.usedCount >= coupon.maxUses) ||
      subtotal < Number(coupon.minOrderAmount)
    )
      throw new BadRequestException('Coupon is not valid');
    return coupon;
  }

  private changeStatusAndRestock(
    id: string,
    previous: OrderStatus,
    status: OrderStatus,
    items: { productId: string; quantity: number }[],
    note?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.RETURN,
            quantity: item.quantity,
            before: product.stock - item.quantity,
            after: product.stock,
            reason: `Order ${previous} → ${status}`,
          },
        });
      }
      return tx.order.update({
        where: { id },
        data: { status, statusHistory: { create: { status, note } } },
        include: orderInclude,
      });
    });
  }
}

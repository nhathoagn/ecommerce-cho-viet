import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryTransactionType,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  AdjustInventoryDto,
  CreateCategoryDto,
  CreateProductDto,
  CreateStoreDto,
  ProductQueryDto,
  UpdateProductDto,
  UpdateStoreDto,
} from './catalog.dto.js';

const productInclude = {
  images: { orderBy: { position: 'asc' as const } },
  category: true,
  store: { select: { id: true, name: true, slug: true, logoKey: true } },
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class SellerCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  getStore(sellerId: string) {
    return this.prisma.store.findUnique({ where: { sellerId } });
  }

  async createStore(sellerId: string, dto: CreateStoreDto) {
    if (await this.prisma.store.findUnique({ where: { sellerId } })) {
      throw new ConflictException('Seller already has a store');
    }
    return this.prisma.store.create({
      data: {
        sellerId,
        slug: await this.uniqueStoreSlug(dto.name),
        name: dto.name,
        description: dto.description,
        logoKey: dto.logoKey,
        bannerKey: dto.bannerKey,
      },
    });
  }

  async updateStore(sellerId: string, dto: UpdateStoreDto) {
    const store = await this.requireStore(sellerId);
    return this.prisma.store.update({ where: { id: store.id }, data: dto });
  }

  async createCategory(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('Parent category not found');
    }
    const slug = await this.uniqueCategorySlug(dto.name);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        imageKey: dto.imageKey,
        parentId: dto.parentId,
        slug,
      },
    });
  }

  async listProducts(sellerId: string) {
    const store = await this.requireStore(sellerId);
    return this.prisma.product.findMany({
      where: { storeId: store.id },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(sellerId: string, dto: CreateProductDto) {
    const store = await this.requireStore(sellerId);
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) throw new ConflictException('SKU already exists');
    const stock = dto.stock ?? 0;
    const status = this.normalizedStatus(
      dto.status ?? ProductStatus.DRAFT,
      stock,
    );
    const { images, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...data,
          slug: await this.uniqueProductSlug(dto.name),
          storeId: store.id,
          stock,
          status,
          price: new Prisma.Decimal(dto.price),
          compareAtPrice:
            dto.compareAtPrice === undefined
              ? undefined
              : new Prisma.Decimal(dto.compareAtPrice),
          images: images?.length ? { create: images } : undefined,
        },
        include: productInclude,
      });
      if (stock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            productId: product.id,
            type: InventoryTransactionType.INITIAL,
            quantity: stock,
            before: 0,
            after: stock,
            reason: 'Initial stock',
          },
        });
      }
      return product;
    });
  }

  async updateProduct(sellerId: string, id: string, dto: UpdateProductDto) {
    const product = await this.requireOwnedProduct(sellerId, id);
    const { images, stock, price, compareAtPrice, ...rest } = dto;
    if (stock !== undefined && stock !== product.stock) {
      throw new BadRequestException(
        'Use the inventory adjustment endpoint to change stock',
      );
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        price: price === undefined ? undefined : new Prisma.Decimal(price),
        compareAtPrice:
          compareAtPrice === undefined
            ? undefined
            : new Prisma.Decimal(compareAtPrice),
        images: images ? { deleteMany: {}, create: images } : undefined,
      },
      include: productInclude,
    });
  }

  async adjustInventory(sellerId: string, id: string, dto: AdjustInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id, store: { sellerId } },
      });
      if (!product) throw new NotFoundException('Product not found');
      const after = product.stock + dto.quantity;
      if (after < 0) throw new BadRequestException('Insufficient stock');
      const status = this.normalizedStatus(product.status, after);
      const updated = await tx.product.update({
        where: { id },
        data: { stock: after, status },
        include: productInclude,
      });
      await tx.inventoryTransaction.create({
        data: {
          productId: id,
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: dto.quantity,
          before: product.stock,
          after,
          reason: dto.reason,
        },
      });
      return updated;
    });
  }

  async inventoryHistory(sellerId: string, id: string) {
    await this.requireOwnedProduct(sellerId, id);
    return this.prisma.inventoryTransaction.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeProduct(sellerId: string, id: string) {
    await this.requireOwnedProduct(sellerId, id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  private normalizedStatus(status: ProductStatus, stock: number) {
    if (stock === 0 && status === ProductStatus.ACTIVE)
      return ProductStatus.OUT_OF_STOCK;
    if (stock > 0 && status === ProductStatus.OUT_OF_STOCK)
      return ProductStatus.ACTIVE;
    return status;
  }

  private async requireStore(sellerId: string) {
    const store = await this.prisma.store.findUnique({ where: { sellerId } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  private async requireOwnedProduct(sellerId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, store: { sellerId } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async uniqueStoreSlug(name: string) {
    return this.uniqueSlug(slugify(name), (slug) =>
      this.prisma.store.findUnique({ where: { slug } }),
    );
  }

  private async uniqueCategorySlug(name: string) {
    return this.uniqueSlug(slugify(name), (slug) =>
      this.prisma.category.findUnique({ where: { slug } }),
    );
  }

  private async uniqueProductSlug(name: string) {
    return this.uniqueSlug(slugify(name), (slug) =>
      this.prisma.product.findUnique({ where: { slug } }),
    );
  }

  private async uniqueSlug(
    base: string,
    find: (slug: string) => Promise<unknown>,
  ) {
    const safeBase = base || 'item';
    let slug = safeBase;
    let suffix = 1;
    while (await find(slug)) slug = `${safeBase}-${suffix++}`;
    return slug;
  }
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  products(query: ProductQueryDto) {
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        ...(query.search
          ? { name: { contains: query.search, mode: 'insensitive' as const } }
          : {}),
        ...(query.category ? { category: { slug: query.category } } : {}),
        ...(query.store ? { store: { slug: query.store } } : {}),
      },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async product(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}

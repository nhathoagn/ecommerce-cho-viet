import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  AddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from '../auth/auth.dto.js';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  profile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: userSelect,
    });
  }
  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: userSelect,
    });
  }
  addresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: AddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const makeDefault = dto.isDefault || count === 0;
      if (makeDefault)
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      return tx.address.create({
        data: { ...dto, isDefault: makeDefault, userId },
      });
    });
  }

  async updateAddress(userId: string, id: string, dto: UpdateAddressDto) {
    await this.ensureAddress(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault)
        await tx.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      return tx.address.update({ where: { id }, data: dto });
    });
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.ensureAddress(userId, id);
    await this.prisma.address.delete({ where: { id } });
    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next)
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
    }
    return { success: true };
  }

  private async ensureAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }
}

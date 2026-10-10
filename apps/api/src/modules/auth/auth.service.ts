import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  jti?: string;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret =
      config.get<string>('JWT_ACCESS_SECRET') ?? 'development-access-secret';
    this.refreshSecret =
      config.get<string>('JWT_REFRESH_SECRET') ?? 'development-refresh-secret';
    this.accessTtl = Number(config.get('JWT_ACCESS_TTL_SECONDS') ?? 900);
    this.refreshTtl = Number(
      config.get('JWT_REFRESH_TTL_SECONDS') ?? 2_592_000,
    );
  }

  async register(dto: RegisterDto, role: UserRole) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email is already registered');
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await hash(dto.password, 12),
        name: dto.name.trim(),
        phone: dto.phone,
        role,
      },
    });
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is suspended');
    }
    return this.createSession(user);
  }

  async refresh(rawToken: string) {
    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(rawToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh')
      throw new UnauthorizedException('Invalid refresh token');

    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token is expired or revoked');
    }
    if (stored.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is suspended');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.createSession(stored.user);
  }

  async logout(rawToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async createSession(user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatarUrl: string | null;
    role: UserRole;
    status: UserStatus;
  }) {
    const base = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(
      { ...base, type: 'access' } satisfies TokenPayload,
      { secret: this.accessSecret, expiresIn: this.accessTtl },
    );
    const refreshToken = await this.jwt.signAsync(
      { ...base, type: 'refresh', jti: randomUUID() } satisfies TokenPayload,
      { secret: this.refreshSecret, expiresIn: this.refreshTtl },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      },
    });
    return { accessToken, refreshToken, user: this.publicUser(user) };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatarUrl: string | null;
    role: UserRole;
    status: UserStatus;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
    };
  }
}

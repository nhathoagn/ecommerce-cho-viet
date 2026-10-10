import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterWithRoleDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterWithRoleDto) {
    const { role, fullName, storeName: _storeName, ...registration } = dto;
    return this.auth.register(
      { ...registration, name: registration.name ?? fullName! },
      role,
    );
  }

  @Post('register/buyer')
  @ApiOkResponse({ type: AuthResponseDto })
  registerBuyer(@Body() dto: RegisterDto) {
    return this.auth.register(dto, UserRole.BUYER);
  }

  @Post('register/seller')
  @ApiOkResponse({ type: AuthResponseDto })
  registerSeller(@Body() dto: RegisterDto) {
    return this.auth.register(dto, UserRole.SELLER);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshTokenDto) {
    return this.auth.logout(dto.refreshToken);
  }
}

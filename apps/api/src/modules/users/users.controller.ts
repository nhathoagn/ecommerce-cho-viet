import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import {
  AddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from '../auth/auth.dto.js';
import { JwtAuthGuard } from '../auth/auth.guards.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() profile(@CurrentUser() user: AuthUser) {
    return this.users.profile(user.id);
  }
  @Patch() update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(user.id, dto);
  }
  @Get('addresses') addresses(@CurrentUser() user: AuthUser) {
    return this.users.addresses(user.id);
  }
  @Post('addresses') createAddress(
    @CurrentUser() user: AuthUser,
    @Body() dto: AddressDto,
  ) {
    return this.users.createAddress(user.id, dto);
  }
  @Patch('addresses/:id') updateAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.users.updateAddress(user.id, id, dto);
  }
  @Patch('addresses/:id/default') setDefaultAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.users.updateAddress(user.id, id, { isDefault: true });
  }
  @Delete('addresses/:id') deleteAddress(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.users.deleteAddress(user.id, id);
  }
}

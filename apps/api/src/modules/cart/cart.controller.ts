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
import { JwtAuthGuard } from '../auth/auth.guards.js';
import { AddCartItemDto, UpdateCartItemDto } from './cart.dto.js';
import { CartService } from './cart.service.js';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}
  @Get() get(@CurrentUser() user: AuthUser) {
    return this.cart.get(user.id);
  }
  @Post('items') add(
    @CurrentUser() user: AuthUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.add(user.id, dto);
  }
  @Patch('items/:id') update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.update(user.id, id, dto);
  }
  @Delete('items/:id') remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.cart.remove(user.id, id);
  }
  @Delete() clear(@CurrentUser() user: AuthUser) {
    return this.cart.clear(user.id);
  }
}

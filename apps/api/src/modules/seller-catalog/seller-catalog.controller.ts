import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.decorators.js';
import { JwtAuthGuard, RolesGuard } from '../auth/auth.guards.js';
import {
  AdjustInventoryDto,
  CreateCategoryDto,
  CreateProductDto,
  ProductQueryDto,
  CreateStoreDto,
  UpdateProductDto,
  UpdateStoreDto,
} from './catalog.dto.js';
import { SellerCatalogService } from './catalog.service.js';

@ApiTags('seller-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
@Controller('seller')
export class SellerCatalogController {
  constructor(private readonly catalog: SellerCatalogService) {}

  @Get('store') store(@CurrentUser() user: AuthUser) {
    return this.catalog.getStore(user.id);
  }
  @Post('store') createStore(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateStoreDto,
  ) {
    return this.catalog.createStore(user.id, dto);
  }
  @Patch('store') updateStore(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.catalog.updateStore(user.id, dto);
  }
  @Post('categories') createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }
  @Get('products') products(
    @CurrentUser() user: AuthUser,
    @Query() query: ProductQueryDto,
  ) {
    return this.catalog.listProducts(user.id, query.page, query.pageSize);
  }
  @Post('products') createProduct(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProductDto,
  ) {
    return this.catalog.createProduct(user.id, dto);
  }
  @Patch('products/:id') updateProduct(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalog.updateProduct(user.id, id, dto);
  }
  @Delete('products/:id') removeProduct(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.catalog.removeProduct(user.id, id);
  }
  @Post('products/:id/inventory') adjustInventory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.catalog.adjustInventory(user.id, id, dto);
  }
  @Get('products/:id/inventory') inventoryHistory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.catalog.inventoryHistory(user.id, id);
  }
}

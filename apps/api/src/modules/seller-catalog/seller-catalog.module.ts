import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SellerCatalogController } from './seller-catalog.controller.js';
import { CatalogService, SellerCatalogService } from './catalog.service.js';
import { CatalogController } from '../catalog/catalog.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [SellerCatalogController, CatalogController],
  providers: [SellerCatalogService, CatalogService],
  exports: [SellerCatalogService, CatalogService],
})
export class SellerCatalogModule {}

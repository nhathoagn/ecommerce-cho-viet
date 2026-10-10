import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductQueryDto } from '../seller-catalog/catalog.dto.js';
import { CatalogService } from '../seller-catalog/catalog.service.js';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('categories') categories() {
    return this.catalog.categories();
  }
  @Get('products') products(@Query() query: ProductQueryDto) {
    return this.catalog.products(query);
  }
  @Get('products/:slug') product(@Param('slug') slug: string) {
    return this.catalog.product(slug);
  }
}

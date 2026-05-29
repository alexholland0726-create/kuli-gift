import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

@Controller('api/products')
export class ProductController {
  constructor(private service: ProductService) {}

  @Get()
  findAll(
    @Query('categoryId') categoryId?: number,
    @Query('keyword') keyword?: string,
    @Query('recommended') recommended?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findAll({ categoryId, keyword, recommended, page, limit });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<Product>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: Partial<Product>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

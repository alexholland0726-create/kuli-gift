import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductDto } from './product.dto';

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
    @Query('sort') sort?: string,
  ) {
    return this.service.findAll({ categoryId, keyword, recommended, page, limit, sort });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, true);
  }

  @Post()
  create(@Body() data: ProductDto) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: ProductDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

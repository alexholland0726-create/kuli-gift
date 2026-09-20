import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50)
  @IsInt({ each: true }) @Min(1, { each: true })
  cartItemIds: number[];

  @IsInt() @Min(1)
  addressId: number;

  @IsOptional() @IsString() @MaxLength(500)
  remark?: string;
}

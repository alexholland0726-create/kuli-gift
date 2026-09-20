import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';

export class AddCartItemDto {
  @IsInt() @Min(1) productId: number;
  @IsInt() @Min(1) @Max(99) quantity: number;
  @IsOptional() @IsString() @MaxLength(100) spec?: string;
}
export class CartQuantityDto { @IsInt() @Min(1) @Max(99) quantity: number; }
export class CartSelectDto {
  @IsArray() @ArrayMaxSize(100) @IsInt({ each: true }) @Min(1, { each: true }) ids: number[];
  @IsBoolean() selected: boolean;
}

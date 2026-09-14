import { IsString, Length, IsOptional, IsBoolean, IsInt, Min, Max, IsNumber, IsArray, ArrayMaxSize, MaxLength, Matches } from 'class-validator';
export class ProductDto {
  @IsString() @Length(1, 200) name: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(99999999) price: number;
  @IsOptional() @IsInt() @Min(0) @Max(1000000) stock?: number;
  @IsOptional() @IsInt() @Min(1) categoryId?: number;
  @IsString() @Matches(/^(\/uploads\/|https:\/\/)/) @MaxLength(500) coverImage: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(500, { each: true }) @Matches(/^(\/uploads\/|https:\/\/)/, { each: true }) images?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(500, { each: true }) @Matches(/^(\/uploads\/|https:\/\/)/, { each: true }) detailImages?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(200, { each: true }) sellingPoints?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isRecommended?: boolean;
}

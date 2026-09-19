import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsString, Length, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCategoryDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString({ message: '请填写分类名称' })
  @Length(1, 100, { message: '分类名称须为 1–100 个字符' })
  name: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt() @Min(0) @Max(2147483647)
  sort?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;

  @ValidateIf((_, value) => value !== undefined)
  @IsString() @MaxLength(500)
  icon?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto, { skipNullProperties: false }) {}

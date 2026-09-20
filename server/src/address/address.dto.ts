import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class AddressDto {
  @IsString() @Length(1, 50) name: string;
  @IsString() @Length(6, 20) phone: string;
  @IsString() @Length(1, 100) province: string;
  @IsString() @Length(1, 100) city: string;
  @IsString() @Length(1, 100) district: string;
  @IsString() @Length(1, 200) detail: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

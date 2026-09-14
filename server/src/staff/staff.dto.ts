import { IsString, Length, Matches, IsOptional, IsBoolean, IsInt, Min, Max, IsArray, ArrayMaxSize, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
export class LoginDto {
  @IsString() @Matches(/^[a-zA-Z0-9_.-]{3,64}$/) username: string;
  @IsString() @Length(12, 128) password: string;
}
export class CreateStaffDto extends LoginDto {
  @IsString() @Length(1, 80) name: string;
}
export class UpdateStaffDto {
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @Length(12, 128) password?: string;
}
export class ChangePasswordDto {
  @IsString() @Length(12, 128) currentPassword: string;
  @IsString() @Length(12, 128) password: string;
}
class InquiryItemDto {
  @IsInt() @Min(1) id: number;
  @IsInt() @Min(1) @Max(1000000) quantity: number;
}
export class InquiryDto {
  @IsString() @Length(1, 80) name: string;
  @IsString() @Length(5, 100) contact: string;
  @IsString() @Length(1, 2000) message: string;
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => InquiryItemDto) products: InquiryItemDto[];
  @IsIn([true]) consent: boolean;
}
export class InquiryStatusDto {
  @IsIn(['new', 'contacted', 'closed']) status: string;
}

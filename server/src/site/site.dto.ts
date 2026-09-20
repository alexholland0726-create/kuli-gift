import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Length, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HomeQuickEntryDto {
  @IsString() @Length(1, 20) name: string;
  @IsInt() @Min(1) categoryId: number;
  @IsString() @Matches(/^(\/static\/|\/uploads\/|https:\/\/)/) image: string;
}

class HomeSceneDto {
  @IsString() @Length(1, 20) title: string;
  @IsString() @Length(1, 60) desc: string;
  @IsInt() @Min(1) categoryId: number;
  @IsOptional() @IsString() @Matches(/^(festival|summer|father|deal|discount|graduate)$/) theme?: string;
}

export class HomeLayoutDto {
  @IsString() @Length(1, 80) shareTitle: string;
  @IsString() @Length(1, 200) notice: string;
  @IsString() @Matches(/^(\/static\/|\/uploads\/|https:\/\/)/) heroImage: string;
  @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => HomeQuickEntryDto)
  quickEntries: HomeQuickEntryDto[];
  @IsArray() @ArrayMaxSize(8) @ValidateNested({ each: true }) @Type(() => HomeSceneDto)
  scenes: HomeSceneDto[];
  @IsOptional() @IsInt() @Min(1) @Max(100) version?: number;
}

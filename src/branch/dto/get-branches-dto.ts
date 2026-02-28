import { IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BranchStatus } from 'src/types/common';

export class GetBranchesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}

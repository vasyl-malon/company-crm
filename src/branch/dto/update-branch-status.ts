import { IsEnum } from 'class-validator';
import { BranchStatus } from 'src/types/common';

export class UpdateBranchStatusDto {
  @IsEnum(BranchStatus)
  status: BranchStatus;
}

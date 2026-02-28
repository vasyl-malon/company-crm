import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';

@Module({
  imports: [],
  providers: [BranchService],
  exports: [BranchService],
  controllers: [BranchController],
})
export class BranchModule {}

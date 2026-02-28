import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetBranchesQueryDto } from './dto/get-branches-dto';
import { CreateBranchDto } from './dto/create-branch-dto.ts';
import { BranchService } from './branch.service';
import { UpdateBranchStatusDto } from './dto/update-branch-status';

@Controller('branches')
@UseGuards(AuthGuard)
export class BranchController {
  constructor(private service: BranchService) {}

  @Get()
  async getAll(@Query() query: GetBranchesQueryDto) {
    return this.service.getAll(query);
  }

  @Get('/:id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOne(id);
  }

  @Post()
  async create(@Body() dto: CreateBranchDto) {
    return this.service.create(dto);
  }

  @Put('/:id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBranchStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}

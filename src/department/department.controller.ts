import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department-dto';
import { DeleteDepartmentDto } from './dto/delete-department-dto';

@Controller('departments')
@UseGuards(AuthGuard)
export class DepartmentController {
  constructor(private service: DepartmentService) {}

  @Get()
  async getAll(@Query('page') page: number, @Query('limit') limit: number) {
    return this.service.getAll({ page, limit });
  }

  @Post()
  async create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @Delete()
  async delete(@Body() dto: DeleteDepartmentDto) {
    return this.service.delete(dto);
  }
}

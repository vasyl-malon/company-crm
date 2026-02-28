import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department-dto';
import { DeleteDepartmentDto } from './dto/delete-department-dto';

@Controller('departments')
@UseGuards(AuthGuard)
export class DepartmentController {
  constructor(private service: DepartmentService) {}

  @Get()
  async getAll(@Query('page') page: number, @Query('limit') limit: number, @Query('search') search: string) {
    return this.service.getAll({ page, limit, search });
  }

  @Post()
  async create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

@Delete('/:id')
async delete(@Param('id') id: string) {
  console.log(`Deleting department with ID: ${id}`);
  return this.service.delete(id);
}
}

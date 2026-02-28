import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department-dto';
import { DeleteDepartmentDto } from './dto/delete-department-dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async create({ name }: CreateDepartmentDto) {
    const department = await this.prisma.department.create({
      data: {
        name,
      },
    });

    return department;
  }

  async getAll(query: any) {
    const { page = 0, limit = 10, search } = query;

    console.log(search)

    const [items, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where: search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {},
        skip: page * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.department.count({
        where: search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {},
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        limit,
        page,
      },
    };
  }

  async delete(id: string) {
    console.log(id)
    const department = await this.prisma.department.delete({
      where: {
        id: parseInt(id),
      },
    });

    return department;
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetBranchesQueryDto } from './dto/get-branches-dto';
import { Prisma } from '@prisma/client';
import { CreateBranchDto } from './dto/create-branch-dto.ts';
import { BranchStatus } from 'src/types/common';
import { UpdateBranchStatusDto } from './dto/update-branch-status';

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  async create({ name }: CreateBranchDto) {
    const exists = await this.prisma.branch.findFirst({
      where: {
        name,
      },
    });

    if (exists) {
      throw new BadRequestException(`Branch with name "${name}" already exists`);
    }

    const branch = await this.prisma.branch.create({
      data: {
        name,
      },
    });

    return branch;
  }

  async getOne(id: number) {
    if (!id) {
      throw new BadRequestException(`No id provided`);
    }

    const branch = this.prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            email: true,
            status: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    return branch;
  }

  async getAll({ page = 0, limit = 10, search, status }: GetBranchesQueryDto) {
    const filters = {
      ...(search && {
        name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
      ...(status && { status }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where: filters,
        include: {
          users: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              email: true,
              status: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
        skip: page * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.branch.count({
        where: filters,
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

  async updateStatus(id: number, dto: UpdateBranchStatusDto) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });

    if (!branch) throw new NotFoundException('Branch not found');
    if (branch.status === BranchStatus.ARCHIVED) {
      throw new BadRequestException('Cannot change status of an archived branch');
    }
    if (branch.status === BranchStatus.ACTIVE && dto.status === BranchStatus.ARCHIVED) {
      throw new BadRequestException('Active branch must be deactivated before archiving');
    }

    const updateData: Prisma.BranchUpdateInput = { status: dto.status };

    if (dto.status === BranchStatus.ACTIVE) updateData.activatedAt = new Date();
    if (dto.status === BranchStatus.INACTIVE) updateData.deactivatedAt = new Date();
    if (dto.status === BranchStatus.ARCHIVED) updateData.archivedAt = new Date();

    return this.prisma.branch.update({
      where: { id },
      data: updateData,
    });
  }
}

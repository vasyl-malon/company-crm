import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUsersDto } from './dto/get-users-dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUsers(query: GetUsersDto) {
    const { page = 0, limit = 10 } = query;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          status: true,
          phoneNumber: true,
        },
        skip: page * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        limit,
        page,
      },
    };
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private authService: UserService) {}

  @Get()
  async getUsers() {
    return this.authService.getUsers();
  }
}

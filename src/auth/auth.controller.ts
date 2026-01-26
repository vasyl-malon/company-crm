import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from 'generated/prisma/enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from './auth.guard';
import { LoginUserDto } from './dto/login-user-dto';
import { OtpDto } from './dto/otp-dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // This would receive requests at '/auth/register'
  @Post('/signup')
  async register(@Body() userDto: LoginUserDto) {
    return this.authService.register(userDto);
  }

  @Post('/login')
  async login(@Body() userDto: LoginUserDto) {
    return this.authService.login(userDto);
  }

  @Post('/otp')
  async checkOtp(@Body() payload: OtpDto) {
    return this.authService.checkOtp(payload);
  }

  @Get('/test')
  async test(@Body() payload: OtpDto) {
    return [
      {
        id: 1,
      },
      {
        id: 2,
      },
      {
        id: 3,
      },
    ];
  }

  @Post('/invite')
  @UseGuards(AuthGuard)
  async send(@Body() body: { email: string; role: Role }, @CurrentUser() user: { id: number }) {
    return this.authService.sendInvitation(body.email, body.role, user.id);
  }

  @Get('/profile')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: { id: number }) {
    return this.authService.sendInvitation(body.email, body.role, user.id);
  }
}

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CodeType, Role, UserStatus } from 'generated/prisma/enums';
import { LoginUserDto } from './dto/login-user-dto';
import { OtpDto } from './dto/otp-dto';
import { MailService } from 'src/integrations/mail/mail.service';
import { InviteUserDto } from './dto/invite-user';
import { CompleteRegistrationDto } from './dto/complete-registration-dto';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async generateToken(user): Promise<string> {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_TOKEN,
      { expiresIn: '1h' },
    );
  }

  generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async register({
    email,
    password,
    birthdate,
    phoneNumber,
    role,
  }: any): Promise<{ token: string }> {
    const hashedPassword = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, birthdate, phoneNumber, role },
    });
    const token = await this.generateToken(user);
    return { token };
  }

  async getProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return {
      id: user?.id,
      avatar: user?.avatarUrl,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
    };
  }

  async login({ email, password }: LoginUserDto) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const now = new Date();
    const fakePassword = '$2b$10$fakehashtofooltheattacker';

    if (!user) {
      // simulate password comparing
      await bcrypt.compare(password, fakePassword);
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (user?.lockedUntil && user?.lockedUntil > now) {
      throw new UnauthorizedException({
        message: 'ACCOUNT_LOCKED',
        retryAt: user.lockedUntil,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const exceededLockTime = user.lockedUntil && user.lockedUntil <= now;
      const attempts = exceededLockTime ? 1 : user.failedLoginAttempts + 1;
      const isLocking = attempts >= MAX_ATTEMPTS;

      const lockedUntilDate = isLocking
        ? new Date(now.getTime() + LOCK_MINUTES * 60000)
        : exceededLockTime
          ? null
          : user.lockedUntil;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: lockedUntilDate,
        },
      });

      if (isLocking) {
        throw new UnauthorizedException({
          message: 'ACCOUNT_LOCKED',
          retryAt: lockedUntilDate,
        });
      }

      const attemptsLeft = MAX_ATTEMPTS - attempts;
      const showAttempts = attemptsLeft <= 3;

      throw new UnauthorizedException({
        message: 'INVALID_CREDENTIALS',
        ...(showAttempts && { attemptsLeft }),
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes TTL

    const verification = await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        type: CodeType.LOGIN,
        codeHash: otpHash,
        expiresAt,
        attemptsLeft: 5,
      },
    });

    await this.mail.sendLoginCode(user.email, otp).catch((e) => console.error(e));

    return { verificationId: verification.id };
  }

  async verifyOtp({ verificationId, code }: OtpDto) {
    const record = await this.prisma.emailVerification.findUnique({
      where: { id: verificationId },
    });
    const now = new Date();

    if (!record || record.usedAt || record.expiresAt < now || record.attemptsLeft <= 0) {
      throw new UnauthorizedException('INVALID_OR_EXPIRED_CODE');
    }

    const isValid = await bcrypt.compare(code, record.codeHash);

    if (!isValid) {
      const isLastAttempt = record.attemptsLeft <= 1;

      const updatedRecord = await this.prisma.emailVerification.update({
        where: { id: record.id },
        data: {
          attemptsLeft: { decrement: 1 },
          usedAt: isLastAttempt ? now : null,
        },
      });

      if (isLastAttempt) {
        throw new UnauthorizedException('MAX_ATTEMPTS_REACHED');
      }

      throw new UnauthorizedException({
        message: 'INVALID_CODE',
        attemptsLeft: updatedRecord.attemptsLeft,
      });
    }

    await this.prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });

    if (!user || (user.lockedUntil && user.lockedUntil > now)) {
      throw new UnauthorizedException('USER_BLOCKED_OR_NOT_FOUND');
    }

    const token = await this.generateToken(user);

    return {
      token,
      user: {
        email: user.email,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async sendInvitation(body: InviteUserDto, id: number) {
    console.log(body);
    const token = this.generateInvitationToken();

    await this.prisma.invitation.create({
      data: {
        email: body.email,
        token,
        role: body.role,
        createdById: id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.create({
      data: {
        ...body,
        status: UserStatus.PENDING,
        birthdate: body.birthdate || '',
      },
    });

    try {
      await this.mail.sendInvitation(body.email, token);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async verifyToken(token: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired token');
    }

    return {
      email: invitation?.email,
      role: invitation?.role,
    };
  }

  async completeRegistration(token: string, dto: CompleteRegistrationDto) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords are different!');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.update({
      where: { email: invitation.email },
      data: {
        password: passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return { success: true };
  }
}

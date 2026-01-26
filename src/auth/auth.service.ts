import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { env } from 'prisma/config';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { CodeType, Role } from 'generated/prisma/enums';
import { LoginUserDto } from './dto/login-user-dto';
import { OtpDto } from './dto/otp-dto';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
      env('JWT_TOKEN'),
      { expiresIn: '1h' },
    );
  }

  generateInvitationToken(): string {
    return randomBytes(32).toString('hex');
  }

  async register({ email, password }: LoginUserDto): Promise<{ token: string }> {
    const hashedPassword = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });
    const token = await this.generateToken(user);
    return { token };
  }

  async login({ email, password }: LoginUserDto): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const now = new Date();

    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (user?.lockedUntil && user?.lockedUntil > now) {
      throw new UnauthorizedException({
        message: 'ACCOUNT_LOCKED',
        retryAt: user.lockedUntil.toISOString(),
      });
    }

    const samePasswords = await bcrypt.compare(password, user.password);

    if (!samePasswords) {
      const attempts = user.failedLoginAttempts + 1;

      const updateData: any = {
        failedLoginAttempts: attempts,
      };

      if (attempts % MAX_ATTEMPTS === 0) {
        updateData.lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException(attempts % MAX_ATTEMPTS === 0 ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS');
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 хв TTL

    const verification = await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        type: CodeType.LOGIN,
        codeHash: otpHash,
        expiresAt,
        attemptsLeft: 5,
      },
    });

    const resend = new Resend(env('RESEND_TOKEN'));

    try {
      console.log(user.email);
      await resend.emails.send({
        from: 'no-reply@resend.dev',
        to: user.email,
        subject: 'Your login code',
        html: `
      <p>Your login code is: <strong>${otp}</strong></p>
      <p>It expires in 5 minutes.</p>
    `,
      });
      return { verificationId: verification.id };
    } catch (e) {
      console.log(e);
    }

    // await this.prisma.user.update({
    //   where: { id: user.id },
    //   data: {
    //     lastLoginAt: now,
    //     failedLoginAttempts: 0,
    //     lockedUntil: null,
    //   },
    // });

    // const token = await this.generateToken(user);
    // return { token };
  }

  async checkOtp({ verificationId, code }: OtpDto) {
    const record = await this.prisma.emailVerification.findFirst({
      where: { id: parseInt(verificationId), usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new UnauthorizedException('INVALID_OR_EXPIRED_CODE');

    console.log(record, code)

    const valid = await bcrypt.compare(code, record.codeHash);

    if (!valid) {
      if (record.attemptsLeft <= 1) {
        // Блокування коду
        await this.prisma.emailVerification.update({
          where: { id: record.id },
          data: { attemptsLeft: 0, usedAt: new Date() },
        });
        throw new UnauthorizedException('MAX_ATTEMPTS_REACHED');
      } else {
        // Зменшуємо лічильник
        await this.prisma.emailVerification.update({
          where: { id: record.id },
          data: { attemptsLeft: record.attemptsLeft - 1 },
        });
        throw new UnauthorizedException(`INVALID_CODE, attempts left: ${record.attemptsLeft - 1}`);
      }
    }

    await this.prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    const token = await this.generateToken(user);

    return { token };
  }

  async sendInvitation(email: string, role: Role, createdById: number): Promise<void> {
    const resend = new Resend(env('RESEND_TOKEN'));
    const token = this.generateInvitationToken();

    await this.prisma.invitation.create({
      data: {
        email,
        token,
        role,
        createdById,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    try {
      await resend.emails.send({
        from: 'malion-company@resend.dev',
        to: email,
        subject: 'Invitation to the company system',
        html: `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
  <h2 style="margin-bottom: 16px;">You’ve been invited</h2>

  <p style="font-size: 14px; line-height: 1.5;">
    You have been invited to join <strong>Malion Company</strong>.
  </p>

  <p style="font-size: 14px; line-height: 1.5;">
    To get access, please set your password by clicking the button below.
  </p>

  <div style="margin: 24px 0;">
    <a
      href="${process.env.BASE_URL}/auth/invitation?token=${token}"
      style="
        display: inline-block;
        padding: 12px 20px;
        background-color: #2563eb;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        font-size: 14px;
      "
    >
      Accept invitation
    </a>
  </div>

  <p style="font-size: 12px; color: #555;">
    This invitation link will expire in 24 hours.
  </p>

  <p style="font-size: 12px; color: #555;">
    If you were not expecting this invitation, you can safely ignore this email.
  </p>

  <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #888;">
    Malion Company · Secure business platform
  </p>
</div>
      `,
      });
    } catch (err) {
      // можна логувати, або зробити retry
      console.error('Failed to send invitation email', err);
      throw new Error('Failed to send invitation email');
    }
  }

  // async login(email: string, password: string): Promise<{ token: string }> {
  //   const user = await this.prisma.user.findUnique({ where: { email } });
  //   if (!user || !(await bcrypt.compare(password, user.password))) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }
  //   const token = await this.generateToken(user.id);
  //   return { token };
  // }

  // async validateToken(token: string): Promise<any> {
  //   try {
  //     return jwt.verify(token, this.jwtSecret);
  //   } catch (error) {
  //     throw new UnauthorizedException('Invalid or expired token');
  //   }
  // }
}

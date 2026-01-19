// src/auth/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { jwtConstants } from './jwt.constants';

export function validateRequest(request: any): boolean {
  const authHeader =
    request.headers['authorization'] || request.headers['Authorization'];
  if (!authHeader) {
    throw new UnauthorizedException('No Authorization header');
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    throw new UnauthorizedException('Invalid Authorization header format');
  }

  try {
    // валідуємо токен
    const payload = verify(token, jwtConstants.secret) as any;
    // ставимо user у request
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return true;
  } catch (err) {
    throw new UnauthorizedException('Invalid or expired token');
  }
}

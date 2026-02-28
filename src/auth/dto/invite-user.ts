import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsEmail,
  IsEnum,
  IsOptional,
  IsDate,
  IsUrl,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class InviteUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'The field is required' })
  email: string;

  @IsEnum(Role, { message: 'The wrong role' })
  @IsNotEmpty({ message: 'The field is required' })
  role: Role;

  @IsString()
  @Matches(/^\d+$/, { message: 'Phone number must contain only numbers' })
  @Length(10, 14)
  phoneNumber: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Birthdate must be a valid date' })
  birthdate?: Date;

  @IsString()
  @Length(2, 14)
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @Length(2, 14)
  @IsNotEmpty()
  lastName: string;

  @Type(() => Number)
  @IsInt({ message: 'Branch ID must be a number' })
  branchId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Department ID must be a number' })
  departmentId?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar URL must be valid' })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Invalid gender',
  })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsOptional()
  @IsString()
  jobPosition?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

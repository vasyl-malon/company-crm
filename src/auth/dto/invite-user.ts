import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsEmail,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from 'generated/prisma/enums';

export class InviteUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'The field is required' })
  email: string;

  @IsEnum(Role, { message: 'The wrong role' })
  @IsNotEmpty({ message: 'The field is required' })
  role: Role;

  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\d+$/, { message: 'Phone number must contain only numbers' })
  @Length(10, 14, { message: 'Phone number must be between 10 and 14 digits' })
  phoneNumber: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Birthdate must be a valid date' })
  birthdate?: Date;

  @IsString({ message: 'First name must be a string' })
  @Length(2, 14, { message: 'First name must be between 2 and 14 characters' })
  @IsNotEmpty({ message: 'The field is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @Length(2, 14, { message: 'Last name must be between 2 and 14 characters' })
  @IsNotEmpty({ message: 'The field is required' })
  lastName: string;

  // @IsUrl({}, { message: 'Avatar URL must be a valid URL' })
  // @IsOptional()
  // public readonly avatarUrl?: string;
}

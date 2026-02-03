import { IsString, IsNotEmpty } from 'class-validator';

export class CompleteRegistrationDto {
  @IsString()
  @IsNotEmpty({ message: 'Not empty' })
  public readonly password: string;

  @IsString()
  @IsNotEmpty({ message: 'Not empty' })
  public readonly confirmPassword: string;
}

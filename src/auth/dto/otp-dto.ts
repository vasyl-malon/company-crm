import { IsString, IsNotEmpty, IsUUID, Length, Matches } from 'class-validator';

export class OtpDto {
  @IsUUID('4', { message: 'Некоректний ідентифікатор верифікації' })
  @IsNotEmpty({ message: 'Ідентифікатор верифікації обов’язковий' })
  public readonly verificationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Код підтвердження обов’язковий' })
  @Length(4, 4, { message: 'Код має складатися з 4 символів' })
  @Matches(/^\d+$/, { message: 'Код має містити лише цифри' })
  public readonly code: string;
}

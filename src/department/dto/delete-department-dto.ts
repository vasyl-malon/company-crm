import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteDepartmentDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Not empty!' })
  readonly id: number;
}

import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateOperacionDto {
  @IsInt()
  @IsNotEmpty()
  habitacion_id: number;
}
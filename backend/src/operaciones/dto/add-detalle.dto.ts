import { IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class AddDetalleDto {
  @IsInt()
  @IsNotEmpty()
  producto_id: number;

  @IsInt()
  @IsPositive()
  cantidad: number;
}
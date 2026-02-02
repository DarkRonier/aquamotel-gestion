import { IsString, IsNumber, IsPositive, Min, IsOptional } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsNumber()
  @IsPositive()
  costo: number;

  @IsNumber()
  @IsPositive()
  precio_unitario: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsNumber()
  activo?: number;
}
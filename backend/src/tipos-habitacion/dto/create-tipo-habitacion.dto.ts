// backend/src/tipos-habitacion/dto/create-tipo-habitacion.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTipoHabitacionDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Min(0)
  precio_base: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  precio_media_hora?: number;

  @IsNumber()
  @Min(0)
  precio_noche: number;
}

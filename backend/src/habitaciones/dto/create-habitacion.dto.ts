// backend/src/habitaciones/dto/create-habitacion.dto.ts
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateHabitacionDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsInt()
  tipo_habitacion_id: number;
}

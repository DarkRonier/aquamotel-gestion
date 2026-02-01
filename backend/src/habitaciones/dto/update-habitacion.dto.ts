// backend/src/habitaciones/dto/update-habitacion.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateHabitacionDto } from './create-habitacion.dto';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateHabitacionDto extends PartialType(CreateHabitacionDto) {
  @IsString()
  @IsOptional()
  @IsIn(['Libre', 'Ocupada', 'Limpieza', 'Clausurada'])
  estado_habitacion?: string;
}

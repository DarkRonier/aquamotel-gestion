// backend/src/habitaciones/habitaciones.module.ts
import { Module } from '@nestjs/common';
import { HabitacionesService } from './habitaciones.service';
import { HabitacionesController } from './habitaciones.controller';
import { DatabaseModule } from '../database/database.module';
import { TiposHabitacionModule } from '../tipos-habitacion/tipos-habitacion.module';

@Module({
  imports: [DatabaseModule, TiposHabitacionModule],
  controllers: [HabitacionesController],
  providers: [HabitacionesService],
  exports: [HabitacionesService],
})
export class HabitacionesModule {}
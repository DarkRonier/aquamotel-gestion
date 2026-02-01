import { Module } from '@nestjs/common';
import { TiposHabitacionService } from './tipos-habitacion.service';
import { TiposHabitacionController } from './tipos-habitacion.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TiposHabitacionController],
  providers: [TiposHabitacionService],
  exports: [TiposHabitacionService],
})
export class TiposHabitacionModule {}

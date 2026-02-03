import { Module } from '@nestjs/common';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [OperacionesService],
  controllers: [OperacionesController]
})
export class OperacionesModule {}

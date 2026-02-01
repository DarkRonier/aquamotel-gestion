import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HabitacionesModule } from './habitaciones/habitaciones.module';
import { TiposHabitacionModule } from './tipos-habitacion/tipos-habitacion.module';
import { ProductosModule } from './productos/productos.module';

@Module({
  imports: [DatabaseModule, HabitacionesModule, TiposHabitacionModule, ProductosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

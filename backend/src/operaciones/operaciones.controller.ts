import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { OperacionesService } from './operaciones.service';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { AddDetalleDto } from './dto/add-detalle.dto';

@Controller('operaciones')
export class OperacionesController {
  constructor(private readonly operacionesService: OperacionesService) {}

  @Post('check-in')
  checkIn(@Body() createOperacionDto: CreateOperacionDto) {
    return this.operacionesService.checkIn(createOperacionDto);
  }

  @Post(':id/consumo')
  addConsumo(
    @Param('id', ParseIntPipe) id: number,
    @Body() addDetalleDto: AddDetalleDto
  ) {
    return this.operacionesService.addDetalle(id, addDetalleDto);
  }

  @Post(':id/check-out')
  checkOut(@Param('id', ParseIntPipe) id: number) {
    return this.operacionesService.checkOut(id);
  }

  @Get('activas')
  findAllActivas() {
    return this.operacionesService.findAllActivas();
  }

  @Get(':id/resumen')
  getResumen(@Param('id', ParseIntPipe) id: number) {
    return this.operacionesService.getResumen(id);
  }
}
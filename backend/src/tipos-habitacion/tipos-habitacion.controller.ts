// backend/src/tipos-habitacion/tipos-habitacion.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { TiposHabitacionService } from './tipos-habitacion.service';
import { CreateTipoHabitacionDto } from './dto/create-tipo-habitacion.dto';
import { UpdateTipoHabitacionDto } from './dto/update-tipo-habitacion.dto';

@Controller('tipos-habitacion')
export class TiposHabitacionController {
  constructor(
    private readonly tiposHabitacionService: TiposHabitacionService,
  ) {}

  @Post()
  create(@Body() createTipoHabitacionDto: CreateTipoHabitacionDto) {
    return this.tiposHabitacionService.create(createTipoHabitacionDto);
  }

  @Get()
  findAll() {
    return this.tiposHabitacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposHabitacionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTipoHabitacionDto: UpdateTipoHabitacionDto,
  ) {
    return this.tiposHabitacionService.update(id, updateTipoHabitacionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tiposHabitacionService.remove(id);
  }
}

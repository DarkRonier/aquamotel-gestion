// backend/src/habitaciones/habitaciones.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TiposHabitacionService } from '../tipos-habitacion/tipos-habitacion.service';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { Habitacion } from './entities/habitacion.entity';

@Injectable()
export class HabitacionesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tiposHabitacionService: TiposHabitacionService,
  ) {}

  async create(dto: CreateHabitacionDto): Promise<Habitacion> {
    // Validar que el tipo de habitación existe
    await this.tiposHabitacionService.findOne(dto.tipo_habitacion_id);

    try {
      const result = await this.db.run(
        `INSERT INTO habitaciones (numero, tipo_habitacion_id, estado_habitacion)
         VALUES (?, ?, 'Libre')`,
        [dto.numero, dto.tipo_habitacion_id],
      );

      return this.findOne(result.lastID);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new ConflictException(`La habitación con número ${dto.numero} ya existe`);
      }
      throw new InternalServerErrorException('Error al crear habitación');
    }
  }

  async findAll(): Promise<Habitacion[]> {
    return this.db.all<Habitacion>(`
      SELECT h.*, th.nombre as tipo_nombre
      FROM habitaciones h
      INNER JOIN tipos_habitacion th ON h.tipo_habitacion_id = th.id
      ORDER BY h.numero ASC
    `);
  }

  async findOne(id: number): Promise<Habitacion> {
    const habitacion = await this.db.get<Habitacion>(
      `SELECT h.*, th.nombre as tipo_nombre
       FROM habitaciones h
       INNER JOIN tipos_habitacion th ON h.tipo_habitacion_id = th.id
       WHERE h.id = ?`,
      [id],
    );

    if (!habitacion) {
      throw new NotFoundException(`Habitación con ID ${id} no encontrada`);
    }

    return habitacion;
  }

  async update(id: number, dto: UpdateHabitacionDto): Promise<Habitacion> {
    await this.findOne(id); // Verifica que exista

    if (dto.tipo_habitacion_id) {
      await this.tiposHabitacionService.findOne(dto.tipo_habitacion_id);
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (dto.numero !== undefined) {
      fields.push('numero = ?');
      values.push(dto.numero);
    }
    if (dto.tipo_habitacion_id !== undefined) {
      fields.push('tipo_habitacion_id = ?');
      values.push(dto.tipo_habitacion_id);
    }
    if (dto.estado_habitacion !== undefined) {
      fields.push('estado_habitacion = ?');
      values.push(dto.estado_habitacion);
    }

    if (fields.length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    values.push(id);

    try {
      await this.db.run(`UPDATE habitaciones SET ${fields.join(', ')} WHERE id = ?`, values);
      return this.findOne(id);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new ConflictException(`La habitación con número ${dto.numero} ya existe`);
      }
      throw new InternalServerErrorException('Error al actualizar habitación');
    }
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const result = await this.db.run(`DELETE FROM habitaciones WHERE id = ?`, [id]);

    if (result.changes === 0) {
      throw new InternalServerErrorException('No se pudo eliminar la habitación');
    }
  }
}
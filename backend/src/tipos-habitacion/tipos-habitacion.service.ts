// backend/src/tipos-habitacion/tipos-habitacion.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTipoHabitacionDto } from './dto/create-tipo-habitacion.dto';
import { UpdateTipoHabitacionDto } from './dto/update-tipo-habitacion.dto';
import { TipoHabitacion } from './entities/tipo-habitacion.entity';

@Injectable()
export class TiposHabitacionService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateTipoHabitacionDto): Promise<TipoHabitacion> {
    try {
      const result = await this.db.run(
        `INSERT INTO tipos_habitacion (nombre, precio_base, precio_media_hora, precio_noche)
         VALUES (?, ?, ?, ?)`,
        [
          dto.nombre,
          dto.precio_base,
          dto.precio_media_hora ?? null,
          dto.precio_noche,
        ],
      );

      return this.findOne(result.lastID);
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error al crear tipo de habitación',
      );
    }
  }

  async findAll(): Promise<TipoHabitacion[]> {
    return this.db.all<TipoHabitacion>(
      `SELECT * FROM tipos_habitacion ORDER BY id ASC`,
    );
  }

  async findOne(id: number): Promise<TipoHabitacion> {
    const tipo = await this.db.get<TipoHabitacion>(
      `SELECT * FROM tipos_habitacion WHERE id = ?`,
      [id],
    );

    if (!tipo) {
      throw new NotFoundException(
        `Tipo de habitación con ID ${id} no encontrado`,
      );
    }

    return tipo;
  }

  async update(
    id: number,
    dto: UpdateTipoHabitacionDto,
  ): Promise<TipoHabitacion> {
    await this.findOne(id); // Verifica que exista

    const fields: string[] = [];
    const values: any[] = [];

    if (dto.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(dto.nombre);
    }
    if (dto.precio_base !== undefined) {
      fields.push('precio_base = ?');
      values.push(dto.precio_base);
    }
    if (dto.precio_media_hora !== undefined) {
      fields.push('precio_media_hora = ?');
      values.push(dto.precio_media_hora);
    }
    if (dto.precio_noche !== undefined) {
      fields.push('precio_noche = ?');
      values.push(dto.precio_noche);
    }

    if (fields.length === 0) {
      throw new ConflictException('No hay campos para actualizar');
    }

    values.push(id);

    await this.db.run(
      `UPDATE tipos_habitacion SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Verifica que exista

    const result = await this.db.run(
      `DELETE FROM tipos_habitacion WHERE id = ?`,
      [id],
    );

    if (result.changes === 0) {
      throw new InternalServerErrorException(
        'No se pudo eliminar el tipo de habitación',
      );
    }
  }
}

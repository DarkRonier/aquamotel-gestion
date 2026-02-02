import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateOperacionDto } from './dto/create-operacion.dto';
import { AddDetalleDto } from './dto/add-detalle.dto';
import { Operacion } from './entities/operacion.entity';

@Injectable()
export class OperacionesService {
  constructor(private readonly db: DatabaseService) {}

  // --- CHECK-IN ---
  async checkIn(dto: CreateOperacionDto) {
    // 1. Verificar si la habitación existe y está libre
    const hab = await this.db.get(
      `SELECT estado_habitacion FROM habitaciones WHERE id = ?`,
      [dto.habitacion_id]
    );

    if (!hab) throw new NotFoundException('Habitación no encontrada');
    if (hab.estado_habitacion !== 'Libre') {
      throw new BadRequestException('La habitación no está disponible');
    }

    // 2. Crear la operación y cambiar estado de habitación (Transacción manual)
    await this.db.run('BEGIN TRANSACTION');
    try {
      const result = await this.db.run(
        `INSERT INTO operaciones (habitacion_id, check_in, estado) VALUES (?, CURRENT_TIMESTAMP, 1)`,
        [dto.habitacion_id]
      );

      await this.db.run(
        `UPDATE habitaciones SET estado_habitacion = 'Ocupada' WHERE id = ?`,
        [dto.habitacion_id]
      );

      await this.db.run('COMMIT');
      return { id: result.lastID, message: 'Check-in exitoso' };
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  // --- AGREGAR CONSUMO (Detalle) ---
  async addDetalle(operacionId: number, dto: AddDetalleDto) {
    const { producto_id, cantidad } = dto;

    // 1. Verificar stock y precio del producto
    const producto = await this.db.get(
      `SELECT precio_unitario, stock, nombre FROM productos WHERE id = ? AND activo = 1`,
      [producto_id]
    );
    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (producto.stock < cantidad) throw new BadRequestException(`Stock insuficiente de ${producto.nombre}`);

    // 2. Insertar detalle y actualizar stock (Transacción)
    await this.db.run('BEGIN TRANSACTION');
    try {
      const subTotal = producto.precio_unitario * cantidad;
      
      await this.db.run(
        `INSERT INTO detalles_operacion (operacion_id, producto_id, precio_unitario, cantidad, sub_total) 
         VALUES (?, ?, ?, ?, ?)`,
        [operacionId, producto_id, producto.precio_unitario, cantidad, subTotal]
      );

      await this.db.run(
        `UPDATE productos SET stock = stock - ? WHERE id = ?`,
        [cantidad, producto_id]
      );

      // Actualizar el costo_productos en la tabla operaciones
      await this.db.run(
        `UPDATE operaciones SET costo_productos = costo_productos + ? WHERE id = ?`,
        [subTotal, operacionId]
      );

      await this.db.run('COMMIT');
      return { message: 'Consumo agregado correctamente' };
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  // --- CHECK-OUT (Tu fórmula de cobro) ---
  async checkOut(id: number) {
    const op = await this.db.get(
      `SELECT o.*, th.precio_base, th.precio_media_hora, th.precio_noche 
       FROM operaciones o
       JOIN habitaciones h ON o.habitacion_id = h.id
       JOIN tipos_habitacion th ON h.tipo_habitacion_id = th.id
       WHERE o.id = ? AND o.estado = 1`,
      [id]
    );

    if (!op) throw new NotFoundException('Operación activa no encontrada');

    // 1. Calcular tiempos
    const checkIn = new Date(op.check_in);
    const checkOut = new Date();
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    // 2. Aplicar tu fórmula: costo = precio_base + n * precio_media_hora
    // n = max(0, (minutos / 30) - 3)
    const n = Math.max(0, Math.ceil(diffMin / 30) - 3);
    const costoEstadia = op.precio_base + (n * op.precio_media_hora);
    
    const costoTotal = costoEstadia + op.costo_productos;

    // 3. Cerrar operación y liberar habitación
    await this.db.run('BEGIN TRANSACTION');
    try {
      await this.db.run(
        `UPDATE operaciones SET 
          check_out = CURRENT_TIMESTAMP, 
          costo_estadia = ?, 
          costo_total = ?, 
          estado = 0 
         WHERE id = ?`,
        [costoEstadia, costoTotal, id]
      );

      await this.db.run(
        `UPDATE habitaciones SET estado_habitacion = 'Libre' WHERE id = ?`,
        [op.habitacion_id]
      );

      await this.db.run('COMMIT');
      return {
        id,
        minutos_totales: diffMin,
        bloques_extra: n,
        costo_estadia: costoEstadia,
        costo_productos: op.costo_productos,
        total_a_pagar: costoTotal
      };
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  async findAllActivas(): Promise<Operacion[]> {
    return this.db.all<Operacion>(
        `SELECT o.*, h.numero as habitacion_numero 
        FROM operaciones o 
        JOIN habitaciones h ON o.habitacion_id = h.id 
        WHERE o.estado = 1`
    );
  }

  async getResumen(id: number) {
    const op = await this.db.get(
        `SELECT o.*, th.precio_base, th.precio_media_hora, th.precio_noche, h.numero as habitacion_numero
        FROM operaciones o
        JOIN habitaciones h ON o.habitacion_id = h.id
        JOIN tipos_habitacion th ON h.tipo_habitacion_id = th.id
        WHERE o.id = ? AND o.estado = 1`,
        [id]
    );

    if (!op) throw new NotFoundException('Operación activa no encontrada');

    // Calcular tiempo transcurrido hasta ahora
    const checkIn = new Date(op.check_in);
    const ahora = new Date();
    const diffMs = ahora.getTime() - checkIn.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    // Aplicar tu fórmula
    const n = Math.max(0, Math.ceil(diffMin / 30) - 3);
    const costoEstadiaActual = op.precio_base + (n * op.precio_media_hora);
    const totalActual = costoEstadiaActual + op.costo_productos;

    // Traer los detalles de consumo
    const detalles = await this.db.all(
        `SELECT d.*, p.nombre as producto_nombre 
        FROM detalles_operacion d
        JOIN productos p ON d.producto_id = p.id
        WHERE d.operacion_id = ?`,
        [id]
    );

    return {
        operacion_id: op.id,
        habitacion: op.habitacion_numero,
        check_in: op.check_in,
        minutos_transcurridos: diffMin,
        bloques_extra: n,
        costo_estadia_actual: costoEstadiaActual,
        costo_productos: op.costo_productos,
        total_actual: totalActual,
        detalles_consumo: detalles
    };
  }
}
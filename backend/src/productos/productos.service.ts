import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(private readonly db: DatabaseService) {}

  async create(createProductoDto: CreateProductoDto) {
    const { nombre, costo, precio_unitario, stock } = createProductoDto;
    
    const result = await this.db.run(
      `INSERT INTO productos (nombre, costo, precio_unitario, stock, activo) 
       VALUES (?, ?, ?, ?, 1)`,
      [nombre, costo, precio_unitario, stock]
    );

    return this.findOne(result.lastID);
  }

  async findAll() {
    // Solo traemos los activos por defecto
    return this.db.all<Producto>(`SELECT * FROM productos WHERE activo = 1`);
  }

  async findOne(id: number) {
    const producto = await this.db.get<Producto>(
      `SELECT * FROM productos WHERE id = ?`,
      [id]
    );

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    await this.findOne(id); // Verificar que existe

    const fields = Object.keys(updateProductoDto);
    if (fields.length === 0) return this.findOne(id);

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = Object.values(updateProductoDto);

    await this.db.run(
      `UPDATE productos SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return this.findOne(id);
  }

  async remove(id: number) {
    const producto = await this.findOne(id);
    
    // Borrado lógico: No eliminamos de la DB para no romper historial de ventas
    await this.db.run(
      `UPDATE productos SET activo = 0 WHERE id = ?`,
      [id]
    );

    return { message: `Producto ${producto.nombre} desactivado correctamente` };
  }

  // Método útil para el futuro: descontar stock
  async updateStock(id: number, cantidad: number) {
    const producto = await this.findOne(id);
    
    if (producto.stock + cantidad < 0) {
      throw new BadRequestException(`Stock insuficiente para ${producto.nombre}`);
    }

    await this.db.run(
      `UPDATE productos SET stock = stock + ? WHERE id = ?`,
      [cantidad, id]
    );
  }
}
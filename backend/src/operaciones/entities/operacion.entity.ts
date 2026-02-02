export class Operacion {
  id: number;
  habitacion_id: number;
  check_in: string; // SQLite devuelve las fechas como string ISO
  check_out: string | null;
  costo_estadia: number;
  costo_productos: number;
  costo_total: number;
  estado: number; // 1: Activa, 0: Cerrada

  // Campos opcionales que solemos traer con JOINs
  habitacion_numero?: string;
  detalles?: DetalleOperacion[];
}

export class DetalleOperacion {
  id: number;
  operacion_id: number;
  producto_id: number;
  precio_unitario: number;
  cantidad: number;
  sub_total: number;
  
  // Campo opcional para mostrar el nombre del producto
  producto_nombre?: string;
}
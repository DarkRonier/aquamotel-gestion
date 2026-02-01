// backend/src/tipos-habitacion/entities/tipo-habitacion.entity.ts
export class TipoHabitacion {
  id: number;
  nombre: string;
  precio_base: number;
  precio_media_hora?: number;
  precio_noche: number;
}

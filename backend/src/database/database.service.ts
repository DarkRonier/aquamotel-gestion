// backend/src/database/database.service.ts
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import sqlite3 from 'sqlite3';

type RunResult = { lastID: number; changes: number };

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private db!: sqlite3.Database;

  // Ajusta aquí la ruta del archivo .db
  private readonly dbFilePath = path.resolve(
    process.cwd(),
    'data',
    'aquamotel.db',
  );

  async onModuleInit() {
    await this.open();
    await this.enableForeignKeys();
    await this.initSchema(); // si no quieres auto-init en cada arranque, lo hacemos opcional luego
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async open(): Promise<void> {
    // Asegura que exista la carpeta /data
    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.logger.log(`Opening SQLite DB at: ${this.dbFilePath}`);

    sqlite3.verbose();

    await new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbFilePath, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Opcional: mejora concurrencia para múltiples lecturas
    await this.exec(`PRAGMA journal_mode = WAL;`);
  }

  private async enableForeignKeys(): Promise<void> {
    await this.exec(`PRAGMA foreign_keys = ON;`);
  }

  async close(): Promise<void> {
    if (!this.db) return;

    await new Promise<void>((resolve, reject) => {
      this.db.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    this.logger.log('SQLite connection closed');
  }

  // Ejecuta SQL sin devolver filas (ideal para PRAGMA, CREATE TABLE múltiples, etc.)
  exec(sql: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // INSERT/UPDATE/DELETE
  run(sql: string, params: any[] = []): Promise<RunResult> {
    return new Promise<RunResult>((resolve, reject) => {
      // NO usar arrow function aquí, necesitamos `this.lastID`
      this.db.run(
        sql,
        params,
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        },
      );
    });
  }

  // SELECT single row
  get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row as T | undefined);
      });
    });
  }

  // SELECT multiple rows
  all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve((rows ?? []) as T[]);
      });
    });
  }

  // Inicializa el schema con tu SQL (ordenado + seguro)
  async initSchema(): Promise<void> {
    const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tipos_habitacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio_base REAL NOT NULL,
    precio_media_hora REAL,
    precio_noche REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS habitaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    tipo_habitacion_id INTEGER NOT NULL,
    estado_habitacion TEXT DEFAULT 'Libre',
    FOREIGN KEY (tipo_habitacion_id) REFERENCES tipos_habitacion(id)
);

CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ruc TEXT UNIQUE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    costo REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ingreso_insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    costo_total REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS detalle_ingreso_insumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingreso_insumos_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    costo REAL NOT NULL,
    sub_total REAL NOT NULL,
    FOREIGN KEY (ingreso_insumos_id) REFERENCES ingreso_insumos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS operaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habitacion_id INTEGER NOT NULL,
    check_in DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out DATETIME,
    costo_estadia REAL DEFAULT 0,
    costo_productos REAL DEFAULT 0,
    costo_total REAL DEFAULT 0,
    estado INTEGER DEFAULT 1,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id)
);

CREATE TABLE IF NOT EXISTS detalles_operacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operacion_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    cantidad INTEGER NOT NULL,
    sub_total REAL NOT NULL,
    FOREIGN KEY (operacion_id) REFERENCES operaciones(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS facturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER,
    operacion_id INTEGER NOT NULL UNIQUE,
    monto_total REAL NOT NULL,
    iva REAL DEFAULT 0,
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (operacion_id) REFERENCES operaciones(id)
);

CREATE TABLE IF NOT EXISTS ingresos_egresos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_movimiento INTEGER NOT NULL,
    descripcion TEXT,
    monto REAL NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_operaciones_habitacion_estado ON operaciones(habitacion_id, estado);
CREATE INDEX IF NOT EXISTS idx_detalles_operacion_operacion ON detalles_operacion(operacion_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ingreso_insumos_ingreso ON detalle_ingreso_insumos(ingreso_insumos_id);
`;

    await this.exec(schemaSql);
    this.logger.log('SQLite schema initialized (CREATE TABLE IF NOT EXISTS)');
  }
}

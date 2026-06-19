import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Almacenamiento de archivos en disco local. La interfaz (save/absolutePath/
 * remove) está pensada para poder cambiar a S3 u otro backend sin tocar el
 * resto de la app (Fase posterior).
 */
@Injectable()
export class StorageService {
  private readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = config.get<string>('STORAGE_DIR') || path.join(process.cwd(), 'storage');
    fs.mkdirSync(this.dir, { recursive: true });
  }

  /** Guarda un buffer con un nombre único. Devuelve la ruta relativa y el tamaño. */
  save(buffer: Buffer, originalName: string): { ruta: string; tamano: number } {
    const ext = path.extname(originalName).slice(0, 12);
    const ruta = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(this.dir, ruta), buffer);
    return { ruta, tamano: buffer.length };
  }

  absolutePath(ruta: string): string {
    return path.join(this.dir, ruta);
  }

  remove(ruta: string): void {
    try {
      fs.unlinkSync(this.absolutePath(ruta));
    } catch {
      // archivo ya inexistente: ignorar
    }
  }
}

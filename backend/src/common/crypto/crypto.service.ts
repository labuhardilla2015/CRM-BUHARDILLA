import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // 96 bits, recomendado para GCM
const TAG_LEN = 16;

/**
 * Cifrado simétrico para datos sensibles (datos de cliente, claves).
 * Formato almacenado: base64( iv | authTag | ciphertext ).
 * La clave (32 bytes) se lee de ENCRYPTION_KEY (hex de 64 caracteres).
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = Buffer.from(hex, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY debe ser 32 bytes (64 caracteres hex)');
    }
  }

  /** Cifra un texto plano. Devuelve null si la entrada es null/undefined. */
  encrypt(plain: string | null | undefined): string | null {
    if (plain == null) return null;
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString('base64');
  }

  /** Descifra un valor producido por encrypt(). Devuelve null si la entrada es null. */
  decrypt(payload: string | null | undefined): string | null {
    if (payload == null) return null;
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ct = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  }
}

import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  const key = '00'.repeat(32); // 32 bytes en hex (64 caracteres)
  const config = { getOrThrow: () => key } as unknown as ConfigService;
  const crypto = new CryptoService(config);

  it('cifra y descifra (roundtrip) preservando el texto, incluido UTF-8', () => {
    const plano = 'S3cr3t0! contraseña áéíóú';
    const cifrado = crypto.encrypt(plano);
    expect(cifrado).not.toBe(plano);
    expect(crypto.decrypt(cifrado)).toBe(plano);
  });

  it('devuelve null para entradas null/undefined', () => {
    expect(crypto.encrypt(null)).toBeNull();
    expect(crypto.encrypt(undefined)).toBeNull();
    expect(crypto.decrypt(null)).toBeNull();
  });

  it('produce textos cifrados distintos para el mismo plano (IV aleatorio)', () => {
    expect(crypto.encrypt('hola')).not.toBe(crypto.encrypt('hola'));
  });

  it('rechaza una clave que no sea de 32 bytes', () => {
    const malConfig = { getOrThrow: () => 'abc' } as unknown as ConfigService;
    expect(() => new CryptoService(malConfig)).toThrow();
  });
});

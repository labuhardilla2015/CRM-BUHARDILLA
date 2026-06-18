import { PrismaClient, Rol } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed inicial:
 *  - Registra el correo del admin (y opcionalmente un dominio) en `role_emails`.
 *  - Crea el primer usuario administrador.
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 */
async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@labuhardilla.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminNombre = process.env.SEED_ADMIN_NOMBRE ?? 'Administrador';
  const adminDomain = process.env.ADMIN_EMAIL_DOMAIN;

  // 1) Patrón de email admin (correo exacto)
  await prisma.roleEmail.upsert({
    where: { patron: adminEmail.toLowerCase() },
    update: {},
    create: { patron: adminEmail.toLowerCase(), rol: Rol.ADMIN },
  });

  // 2) Patrón de dominio admin (opcional)
  if (adminDomain) {
    const patronDominio = adminDomain.startsWith('@')
      ? adminDomain.toLowerCase()
      : `@${adminDomain.toLowerCase()}`;
    await prisma.roleEmail.upsert({
      where: { patron: patronDominio },
      update: {},
      create: { patron: patronDominio, rol: Rol.ADMIN },
    });
  }

  // 3) Usuario administrador inicial
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.usuario.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { rol: Rol.ADMIN },
    create: {
      nombre: adminNombre,
      email: adminEmail.toLowerCase(),
      passwordHash,
      rol: Rol.ADMIN,
    },
  });

  console.log(`✅ Seed completado. Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

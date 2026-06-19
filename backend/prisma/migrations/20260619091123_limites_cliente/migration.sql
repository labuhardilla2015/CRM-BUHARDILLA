-- AlterTable
ALTER TABLE `notificaciones` MODIFY `tipo` ENUM('TARJETA_ASIGNADA', 'POTENCIAL', 'REUNION', 'LIMITE_HORAS') NOT NULL;

-- CreateTable
CREATE TABLE `limites_cliente` (
    `id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `accion` ENUM('SEO', 'WEB', 'RRSS', 'DISENO', 'INFORMES', 'SEO_LOCAL', 'ADS', 'ADMINISTRACION', 'ESTRATEGIA', 'EMAIL_MARKETING') NOT NULL,
    `horas` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `limites_cliente_cliente_id_accion_key`(`cliente_id`, `accion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `limites_cliente` ADD CONSTRAINT `limites_cliente_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

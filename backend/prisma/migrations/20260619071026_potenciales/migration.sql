-- CreateTable
CREATE TABLE `potenciales` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(160) NOT NULL,
    `contacto` VARCHAR(255) NULL,
    `origen` VARCHAR(120) NULL,
    `notas` TEXT NULL,
    `estado` ENUM('NUEVO', 'CONTACTADO', 'PRESUPUESTO_ENVIADO', 'ACEPTADO', 'RECHAZADO') NOT NULL DEFAULT 'NUEVO',
    `cliente_convertido_id` VARCHAR(191) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `potenciales_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `potenciales` ADD CONSTRAINT `potenciales_cliente_convertido_id_fkey` FOREIGN KEY (`cliente_convertido_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `potenciales` ADD CONSTRAINT `potenciales_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

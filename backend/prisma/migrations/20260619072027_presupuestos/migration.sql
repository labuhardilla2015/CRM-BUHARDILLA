-- CreateTable
CREATE TABLE `presupuestos` (
    `id` VARCHAR(191) NOT NULL,
    `potencial_id` VARCHAR(191) NULL,
    `cliente_id` VARCHAR(191) NULL,
    `concepto` VARCHAR(255) NOT NULL,
    `detalle` TEXT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `estado` ENUM('BORRADOR', 'ENVIADO', 'ACEPTADO', 'RECHAZADO') NOT NULL DEFAULT 'BORRADOR',
    `token_aceptacion` VARCHAR(191) NULL,
    `aceptado_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `presupuestos_token_aceptacion_key`(`token_aceptacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `presupuestos` ADD CONSTRAINT `presupuestos_potencial_id_fkey` FOREIGN KEY (`potencial_id`) REFERENCES `potenciales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presupuestos` ADD CONSTRAINT `presupuestos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

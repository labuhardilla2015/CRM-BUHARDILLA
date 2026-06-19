-- CreateTable
CREATE TABLE `claves_cliente` (
    `id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `seccion` ENUM('CLAVE', 'SERVIDOR') NOT NULL,
    `etiqueta` VARCHAR(200) NOT NULL,
    `url` VARCHAR(500) NULL,
    `usuario` TEXT NULL,
    `secreto` TEXT NULL,
    `notas` TEXT NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `claves_cliente_cliente_id_seccion_idx`(`cliente_id`, `seccion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `claves_cliente` ADD CONSTRAINT `claves_cliente_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

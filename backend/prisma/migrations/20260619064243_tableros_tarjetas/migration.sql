-- CreateTable
CREATE TABLE `tableros` (
    `id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('INFORMACION', 'ADS', 'SEO', 'WEB', 'DISENO', 'REDES', 'ESTRATEGICO', 'AUDIOVISUAL') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tableros_cliente_id_tipo_key`(`cliente_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarjetas` (
    `id` VARCHAR(191) NOT NULL,
    `tablero_id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` ENUM('PENDIENTE', 'EN_CURSO', 'HECHO') NOT NULL DEFAULT 'PENDIENTE',
    `fecha_inicio` DATETIME(3) NULL,
    `fecha_fin` DATETIME(3) NULL,
    `progreso` INTEGER NOT NULL DEFAULT 0,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tarjetas_tablero_id_estado_idx`(`tablero_id`, `estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tableros` ADD CONSTRAINT `tableros_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarjetas` ADD CONSTRAINT `tarjetas_tablero_id_fkey` FOREIGN KEY (`tablero_id`) REFERENCES `tableros`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

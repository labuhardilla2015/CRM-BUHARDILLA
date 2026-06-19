-- CreateTable
CREATE TABLE `clientes` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(160) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `clientes_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros_tiempo` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `cliente_id` VARCHAR(191) NOT NULL,
    `accion` ENUM('SEO', 'WEB', 'RRSS', 'DISENO', 'INFORMES', 'SEO_LOCAL', 'ADS', 'ADMINISTRACION', 'ESTRATEGIA', 'EMAIL_MARKETING') NOT NULL,
    `inicio` DATETIME(3) NOT NULL,
    `fin` DATETIME(3) NULL,
    `descripcion` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registros_tiempo_usuario_id_inicio_idx`(`usuario_id`, `inicio`),
    INDEX `registros_tiempo_cliente_id_inicio_idx`(`cliente_id`, `inicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registros_tiempo` ADD CONSTRAINT `registros_tiempo_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_tiempo` ADD CONSTRAINT `registros_tiempo_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

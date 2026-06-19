-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `foto_ruta` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `documentos_empleado` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `ruta` VARCHAR(255) NOT NULL,
    `mime` VARCHAR(120) NOT NULL,
    `tamano` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documentos_empleado_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `documentos_empleado` ADD CONSTRAINT `documentos_empleado_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` VARCHAR(191) NOT NULL,
    `usuario_id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('TARJETA_ASIGNADA', 'POTENCIAL', 'REUNION') NOT NULL,
    `mensaje` VARCHAR(300) NOT NULL,
    `entidad_tipo` VARCHAR(40) NULL,
    `entidad_id` VARCHAR(191) NULL,
    `fecha_fin` DATETIME(3) NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificaciones_usuario_id_leida_idx`(`usuario_id`, `leida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

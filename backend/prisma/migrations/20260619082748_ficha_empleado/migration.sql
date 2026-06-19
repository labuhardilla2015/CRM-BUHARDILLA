-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `contrato_nombre` VARCHAR(255) NULL,
    ADD COLUMN `contrato_ruta` VARCHAR(255) NULL,
    ADD COLUMN `dni` VARCHAR(20) NULL,
    ADD COLUMN `en_practicas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `puesto` VARCHAR(120) NULL,
    ADD COLUMN `telefono` VARCHAR(30) NULL;

-- Código de recuperación de un solo uso para el panel.
-- Es opcional: null significa que no hay ninguno activo.

ALTER TABLE "admin_users" ADD COLUMN "recoveryCodeHash" TEXT;

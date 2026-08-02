-- El acceso al panel pasa de correo a nombre de usuario.
-- Se renombra la columna en vez de borrarla y crearla: asi se conserva
-- el registro del admin y no hace falta volver a sembrarlo.

ALTER TABLE "admin_users" RENAME COLUMN "email" TO "username";

ALTER INDEX "admin_users_email_key" RENAME TO "admin_users_username_key";

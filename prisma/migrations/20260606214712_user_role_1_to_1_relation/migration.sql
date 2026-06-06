/*
  Warnings:

  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role_id" UUID NOT NULL;

-- DropTable
DROP TABLE "user_roles";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

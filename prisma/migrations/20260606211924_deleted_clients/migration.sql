/*
  Warnings:

  - You are about to drop the `client_companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "client_companies" DROP CONSTRAINT "client_companies_avatar_id_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_avatar_id_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_company_id_fkey";

-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_id_fkey";

-- DropTable
DROP TABLE "client_companies";

-- DropTable
DROP TABLE "clients";

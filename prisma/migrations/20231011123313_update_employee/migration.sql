/*
  Warnings:

  - The primary key for the `employee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `employee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employee" DROP CONSTRAINT "employee_pkey",
DROP COLUMN "id";

-- CreateIndex
CREATE UNIQUE INDEX "employee_employeeId_key" ON "employee"("employeeId");

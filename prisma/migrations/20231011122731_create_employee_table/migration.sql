-- CreateTable
CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "middleName" TEXT,
    "email" TEXT,
    "track" TEXT,
    "designation" TEXT,
    "role" TEXT,
    "program" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "age" TEXT,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "mobileNumber" TEXT,
    "presentAddress" TEXT,
    "permanentAddress" TEXT,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

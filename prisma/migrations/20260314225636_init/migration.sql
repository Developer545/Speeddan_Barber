-- CreateEnum
CREATE TYPE "BarberPlan" AS ENUM ('TRIAL', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BarberTenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BarberUserRole" AS ENUM ('OWNER', 'BARBER', 'CLIENT');

-- CreateEnum
CREATE TYPE "BarberAppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BarberPaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'QR');

-- CreateEnum
CREATE TYPE "BarberPaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "barber_tenants" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "BarberPlan" NOT NULL DEFAULT 'TRIAL',
    "status" "BarberTenantStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "paidUntil" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "maxBarbers" INTEGER NOT NULL DEFAULT 3,
    "themeConfig" JSONB NOT NULL DEFAULT '{}',
    "modules" JSONB NOT NULL DEFAULT '{"appointments":true,"billing":false,"loyalty":false,"products":false}',
    "logoUrl" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SV',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "barber_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_users" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "BarberUserRole" NOT NULL DEFAULT 'CLIENT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barbers" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_schedules" (
    "id" SERIAL NOT NULL,
    "barberId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "barber_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_services" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_appointments" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "barberId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "BarberAppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_payments" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "BarberPaymentMethod" NOT NULL DEFAULT 'CASH',
    "status" "BarberPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_reviews" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "barberId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barber_tenants_slug_key" ON "barber_tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "barber_users_email_tenantId_key" ON "barber_users"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "barber_sessions_refreshToken_key" ON "barber_sessions"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "barbers_userId_key" ON "barbers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "barber_schedules_barberId_dayOfWeek_key" ON "barber_schedules"("barberId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "barber_appointments_barberId_startTime_key" ON "barber_appointments"("barberId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "barber_payments_appointmentId_key" ON "barber_payments"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "barber_reviews_appointmentId_key" ON "barber_reviews"("appointmentId");

-- AddForeignKey
ALTER TABLE "barber_users" ADD CONSTRAINT "barber_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_sessions" ADD CONSTRAINT "barber_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "barber_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_sessions" ADD CONSTRAINT "barber_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbers" ADD CONSTRAINT "barbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "barber_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_schedules" ADD CONSTRAINT "barber_schedules_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_services" ADD CONSTRAINT "barber_services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_appointments" ADD CONSTRAINT "barber_appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_appointments" ADD CONSTRAINT "barber_appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "barber_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_appointments" ADD CONSTRAINT "barber_appointments_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_appointments" ADD CONSTRAINT "barber_appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "barber_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_payments" ADD CONSTRAINT "barber_payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_payments" ADD CONSTRAINT "barber_payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "barber_appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_reviews" ADD CONSTRAINT "barber_reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "barber_tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_reviews" ADD CONSTRAINT "barber_reviews_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "barber_appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_reviews" ADD CONSTRAINT "barber_reviews_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

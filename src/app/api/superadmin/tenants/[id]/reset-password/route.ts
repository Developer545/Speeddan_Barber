import { NextRequest, NextResponse } from 'next/server';
import { validateSuperadminKey, unauthorizedResponse } from '@/lib/superadmin-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSuperadminKey(req)) return unauthorizedResponse();

  const { id } = await params;

  const owner = await prisma.barberUser.findFirst({
    where: { tenantId: Number(id), role: 'OWNER' },
    select: { id: true, email: true, fullName: true },
  });

  if (!owner) {
    return NextResponse.json({ error: 'El tenant no tiene propietario registrado' }, { status: 404 });
  }

  const newPassword = generatePassword();
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.barberUser.update({
    where: { id: owner.id },
    data: { password: hashed },
  });

  return NextResponse.json({
    ownerEmail: owner.email,
    ownerName: owner.fullName,
    newPassword,
  });
}

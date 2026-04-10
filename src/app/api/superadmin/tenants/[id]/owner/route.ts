import { NextRequest, NextResponse } from 'next/server';
import { validateSuperadminKey, unauthorizedResponse } from '@/lib/superadmin-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!validateSuperadminKey(req)) return unauthorizedResponse();

  const { id } = await params;
  const owner = await prisma.barberUser.findFirst({
    where:  { tenantId: Number(id), role: 'OWNER' },
    select: { id: true, fullName: true, email: true, role: true, createdAt: true },
  });

  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
  return NextResponse.json(owner);
}

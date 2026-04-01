import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT = {
  brandName: 'Speeddan',
  tagline: 'Sistema de gestión para barberías',
  features: [
    { title: 'Gestión de Citas', description: 'Agenda online en tiempo real' },
    { title: 'Reportes y Caja', description: 'Control financiero completo' },
    { title: 'Gestión de Clientes', description: 'Historial y fidelización' },
  ],
};

export async function GET() {
  try {
    const config = await prisma.barberGlobalConfig.findUnique({ where: { id: 1 } });
    if (!config) return NextResponse.json(DEFAULT);
    return NextResponse.json({
      brandName: config.brandName,
      tagline: config.tagline,
      features: config.features,
    });
  } catch {
    return NextResponse.json(DEFAULT);
  }
}

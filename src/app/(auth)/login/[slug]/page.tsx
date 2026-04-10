/**
 * /login/[slug] — Acceso directo por empresa.
 * El slug viene en la URL → no hay que escribirlo.
 * Carga el tenant, detecta si es barbería o salón y
 * renderiza LoginClient directamente en el paso de credenciales.
 */
import { redirect } from 'next/navigation';
import { prisma }   from '@/lib/prisma';
import LoginClient  from '../LoginClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.barberTenant.findUnique({
    where:  { slug },
    select: { name: true },
  });
  return {
    title: tenant ? `Iniciar sesión — ${tenant.name}` : 'Iniciar sesión',
  };
}

export default async function LoginSlugPage({ params }: Props) {
  const { slug } = await params;

  const tenant = await prisma.barberTenant.findUnique({
    where:  { slug },
    select: {
      id: true, slug: true, name: true, logoUrl: true,
      status: true, themeConfig: true, businessType: true,
    },
  });

  // Slug inválido → redirige al login genérico
  if (!tenant) redirect('/login');

  const themeConfig = (tenant.themeConfig ?? {}) as Record<string, string>;

  return (
    <LoginClient
      initialBranding={null}
      initialTenant={{ ...tenant, themeConfig }}
      initialStep="credenciales"
    />
  );
}

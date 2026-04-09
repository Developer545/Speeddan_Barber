import { prisma } from '@/lib/prisma';
import dynamic from 'next/dynamic';

// ssr: false elimina cualquier hydration mismatch entre servidor y cliente.
// El tema (localStorage) y otros valores del cliente causan divergencia en React 19.
const LoginClient = dynamic(() => import('./LoginClient'), { ssr: false, loading: () => null });

const DEFAULT_BRANDING = {
  brandName: 'Speeddan',
  tagline: 'Sistema de gestión para barberías',
  features: [
    { title: 'Gestión de Citas', description: 'Agenda online en tiempo real' },
    { title: 'Reportes y Caja', description: 'Control financiero completo' },
    { title: 'Gestión de Clientes', description: 'Historial y fidelización' },
  ],
};

async function getBranding() {
  try {
    const config = await prisma.barberGlobalConfig.findUnique({ where: { id: 1 } });
    if (!config) return DEFAULT_BRANDING;
    const raw = config.features;
    const features = Array.isArray(raw)
      ? (raw as { title: string; description: string }[])
      : typeof raw === 'string'
        ? (JSON.parse(raw) as { title: string; description: string }[])
        : DEFAULT_BRANDING.features;
    return {
      brandName: config.brandName || DEFAULT_BRANDING.brandName,
      tagline: config.tagline || DEFAULT_BRANDING.tagline,
      features,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export default async function LoginPage() {
  const branding = await getBranding();
  return <LoginClient initialBranding={branding} />;
}

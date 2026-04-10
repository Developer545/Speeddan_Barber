'use client';

/**
 * LoginWrapper — Client Component intermedio.
 * next/dynamic con ssr:false solo puede usarse dentro de un Client Component.
 * page.tsx (Server Component) importa este wrapper y le pasa el branding.
 */

import dynamic from 'next/dynamic';

type BrandingConfig = {
  brandName: string;
  tagline: string;
  features: { title: string; description: string }[];
};

const LoginClient = dynamic(() => import('./LoginClient'), {
  ssr: false,
  loading: () => null,
});

export default function LoginWrapper({ initialBranding }: { initialBranding: BrandingConfig | null }) {
  return <LoginClient initialBranding={initialBranding} />;
}

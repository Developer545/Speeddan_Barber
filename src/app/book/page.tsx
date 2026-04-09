/**
 * GET /book — Directorio público de negocios activos.
 * Permite filtrar por tipo: ?type=BARBERIA | ?type=SALON
 */

import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import type { BusinessType } from '@prisma/client';

const VALID_TYPES: BusinessType[] = ['BARBERIA', 'SALON'];

type Props = {
  searchParams: Promise<{ type?: string }>;
};

export default async function BookDirectoryPage({ searchParams }: Props) {
  const { type: rawType } = await searchParams;
  const type = VALID_TYPES.includes(rawType as BusinessType) ? (rawType as BusinessType) : null;

  const negocios = await prisma.barberTenant.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL'] },
      deletedAt: null,
      ...(type && { businessType: type }),
    },
    select: {
      id:           true,
      name:         true,
      slug:         true,
      city:         true,
      address:      true,
      phone:        true,
      logoUrl:      true,
      businessType: true,
    },
    orderBy: { name: 'asc' },
  });

  const activeFilter = type ?? 'ALL';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
          Encuentra tu negocio
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
          Selecciona dónde quieres agendar tu cita
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
        {([
          { value: 'ALL',      label: 'Todos',            href: '/book' },
          { value: 'BARBERIA', label: 'Barberías',        href: '/book?type=BARBERIA' },
          { value: 'SALON',    label: 'Salones de Belleza', href: '/book?type=SALON' },
        ] as const).map(({ value, label, href }) => {
          const active = activeFilter === value;
          return (
            <Link
              key={value}
              href={href}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                border: active ? 'none' : '1.5px solid #d1d5db',
                background: active
                  ? value === 'SALON'
                    ? 'linear-gradient(135deg, #8B1E4F 0%, #E06F98 100%)'
                    : value === 'BARBERIA'
                      ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                      : 'linear-gradient(135deg, #374151 0%, #6b7280 100%)'
                  : '#fff',
                color: active ? '#fff' : '#374151',
                boxShadow: active ? '0 4px 14px rgba(0,0,0,0.18)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Resultados */}
      {negocios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9ca3af' }}>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No hay negocios disponibles</p>
        </div>
      ) : (
        <>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
            {negocios.length} {negocios.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {negocios.map((negocio) => (
              <Link
                key={negocio.id}
                href={`/book/${negocio.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    border: '1.5px solid #e5e7eb',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.18s, transform 0.18s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  }}
                >
                  {/* Banner de tipo */}
                  <div style={{
                    height: 6,
                    background: negocio.businessType === 'SALON'
                      ? 'linear-gradient(90deg, #8B1E4F, #E06F98)'
                      : 'linear-gradient(90deg, #1e40af, #3b82f6)',
                  }} />

                  <div style={{ padding: '20px 20px 22px' }}>
                    {/* Logo + badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
                        background: negocio.businessType === 'SALON' ? '#fce7f3' : '#dbeafe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {negocio.logoUrl ? (
                          <Image src={negocio.logoUrl} alt={negocio.name} width={52} height={52} style={{ objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 22 }}>{negocio.businessType === 'SALON' ? '💇' : '💈'}</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                        padding: '4px 10px', borderRadius: 999,
                        background: negocio.businessType === 'SALON' ? '#fce7f3' : '#dbeafe',
                        color: negocio.businessType === 'SALON' ? '#9d174d' : '#1e40af',
                      }}>
                        {negocio.businessType === 'SALON' ? 'Salón' : 'Barbería'}
                      </span>
                    </div>

                    {/* Nombre */}
                    <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                      {negocio.name}
                    </h2>

                    {/* Ciudad */}
                    {negocio.city && (
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        📍 {negocio.city}
                      </p>
                    )}

                    {/* Teléfono */}
                    {negocio.phone && (
                      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                        📞 {negocio.phone}
                      </p>
                    )}

                    <div style={{
                      marginTop: 14, padding: '10px 16px', borderRadius: 10, textAlign: 'center',
                      background: negocio.businessType === 'SALON'
                        ? 'linear-gradient(135deg, #8B1E4F 0%, #E06F98 100%)'
                        : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                      color: '#fff', fontWeight: 700, fontSize: 13,
                    }}>
                      Agendar cita →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

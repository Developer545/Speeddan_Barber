/**
 * DashboardSidebar.tsx — Sidebar del dashboard.
 * Sin colores hardcodeados. Usa CSS variables del sistema.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { BarberUserRole } from '@prisma/client';

type NavItem = { href: string; label: string; icon: string; roles: BarberUserRole[] };

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',      label: 'Inicio',       icon: '◼', roles: ['OWNER', 'BARBER', 'CLIENT'] },
  { href: '/appointments',   label: 'Citas',         icon: '📅', roles: ['OWNER', 'BARBER', 'CLIENT'] },
  { href: '/barbers',        label: 'Barberos',      icon: '✂',  roles: ['OWNER'] },
  { href: '/services',       label: 'Servicios',     icon: '💈', roles: ['OWNER'] },
  { href: '/clients',        label: 'Clientes',      icon: '👤', roles: ['OWNER', 'BARBER'] },
  { href: '/billing',        label: 'Caja',          icon: '💳', roles: ['OWNER'] },
  { href: '/reviews',        label: 'Reseñas',       icon: '⭐', roles: ['OWNER', 'BARBER'] },
  { href: '/settings',       label: 'Configuración', icon: '⚙',  roles: ['OWNER'] },
];

type Props = { role: BarberUserRole; slug: string };

export default function DashboardSidebar({ role, slug }: Props) {
  const pathname = usePathname();
  const items    = NAV_ITEMS.filter(i => i.roles.includes(role));

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'hsl(var(--sidebar-bg))',
      borderRight: '1px solid hsl(var(--sidebar-border))',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid hsl(var(--sidebar-border))' }}>
        <span style={{ color: 'hsl(var(--sidebar-fg))', fontWeight: 700, fontSize: 16 }}>
          ✂ Speeddan
        </span>
        <div style={{ color: 'hsl(var(--sidebar-muted))', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {slug}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              textDecoration: 'none',
              color: active ? 'hsl(var(--btn-primary-fg))' : 'hsl(var(--sidebar-fg))',
              background: active ? 'hsl(var(--brand-primary))' : 'transparent',
              borderRadius: active ? '0 var(--radius-md) var(--radius-md) 0' : undefined,
              marginRight: 12,
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              transition: 'background 0.15s, color 0.15s',
            }}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid hsl(var(--sidebar-border))' }}>
        <form action="/api/auth/logout" method="post">
          <button type="submit" style={{
            width: '100%', padding: '9px', background: 'transparent',
            border: '1px solid hsl(var(--sidebar-border))',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(var(--sidebar-muted))', fontSize: 13, cursor: 'pointer',
          }}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

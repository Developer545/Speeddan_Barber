import { getCurrentUser } from '@/lib/auth';
import { redirect }       from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: '0 0 8px' }}>
        Bienvenido
      </h1>
      <p style={{ color: 'hsl(var(--text-secondary))', margin: 0 }}>
        Panel de gestión — {user.slug}
      </p>

      {/* KPI Cards placeholder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 32 }}>
        {['Citas hoy', 'Citas semana', 'Clientes', 'Ingresos'].map(label => (
          <div key={label} style={{
            background: 'hsl(var(--bg-surface))',
            border: '1px solid hsl(var(--border-default))',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>—</p>
          </div>
        ))}
      </div>
    </div>
  );
}

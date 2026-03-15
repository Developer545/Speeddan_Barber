/**
 * Dashboard — KPIs en tiempo real + gráfica semanal.
 * Server Component: lee datos sin API route.
 */

import { getCurrentUser } from '@/lib/auth';
import { redirect }       from 'next/navigation';
import { getStats }       from '@/modules/appointments/appointments.service';
import DashboardClient    from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const stats = await getStats(user.tenantId);

  return (
    <div style={{ maxWidth: 1200, width: '100%' }}>
      <DashboardClient
        stats={stats}
        userName={user.name}
        userRole={user.role}
        tenantSlug={user.slug}
      />
    </div>
  );
}

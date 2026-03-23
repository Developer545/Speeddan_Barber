/**
 * Layout público para /book/[slug] — sin sidebar, con AntdProvider.
 */
import AntdProvider from '@/components/shared/AntdProvider';
import type { ReactNode } from 'react';

export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <AntdProvider>
      <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
        {children}
      </div>
    </AntdProvider>
  );
}

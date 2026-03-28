'use client';

/**
 * AntdProvider — ConfigProvider dinámico sincronizado con el ThemeContext.
 * Lee colorPrimary del tema activo para que Ant Design siga el tema visual.
 */

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { ThemeProvider, useBarberTheme } from '@/context/ThemeContext';

// ─── Inner: lee el contexto y pasa colorPrimary al ConfigProvider ────────────

function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useBarberTheme();

  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary:  theme.colorPrimary,
          colorLink:     theme.colorPrimary,
          borderRadius:  8,
        },
        components: {
          Table: {
            headerBg:   '#f4f5f8',
            rowHoverBg: `${theme.colorPrimary}18`,
            fontSize:   13,
          },
          Card: {
            borderRadiusLG: 12,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

// ─── Export: envuelve con ThemeProvider + AntdRegistry ───────────────────────

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ThemeProvider>
        <AntdConfigProvider>
          {children}
        </AntdConfigProvider>
      </ThemeProvider>
    </AntdRegistry>
  );
}

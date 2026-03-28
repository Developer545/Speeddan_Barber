'use client';

/**
 * AntdProvider — ConfigProvider dinámico sincronizado con el ThemeContext.
 * Lee colorPrimary + isDark del tema activo para que Ant Design siga el tema visual,
 * incluyendo el algoritmo oscuro cuando el tema lo requiere.
 */

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import esES from 'antd/locale/es_ES';
import { ThemeProvider, useBarberTheme } from '@/context/ThemeContext';

// ─── Inner: lee el contexto y pasa colorPrimary + algoritmo al ConfigProvider ─

function AntdConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useBarberTheme();

  const algorithm = theme.isDark
    ? antdTheme.darkAlgorithm
    : antdTheme.defaultAlgorithm;

  return (
    <ConfigProvider
      locale={esES}
      theme={{
        algorithm,
        token: {
          colorPrimary:  theme.colorPrimary,
          colorLink:     theme.colorPrimary,
          borderRadius:  8,
        },
        components: {
          Table: {
            rowHoverBg: `${theme.colorPrimary}28`,
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

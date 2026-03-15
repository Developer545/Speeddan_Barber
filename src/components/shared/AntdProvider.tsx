'use client';

/**
 * AntdProvider — ConfigProvider con tema teal (color de la barbería).
 * Envuelve el dashboard para que todos los componentes antd hereden
 * el color primario teal en lugar del azul default de Ant Design.
 */

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary:   '#0d9488',   // teal-600 — color de la barbería
            colorLink:      '#0d9488',
            borderRadius:   8,
          },
          components: {
            Table: {
              headerBg:    '#f4f5f8',   // igual que SpeedDanTable
              rowHoverBg:  '#f0fdf9',   // hover teal suave
              fontSize:    13,
            },
            Card: {
              borderRadiusLG: 12,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}

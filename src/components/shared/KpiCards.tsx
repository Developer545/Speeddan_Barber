'use client';

/**
 * KpiCards — Tarjetas de estadísticas rápidas estilo Speeddansys ERP.
 *
 * Uso:
 *   <KpiCards cards={[
 *     { label: 'Total clientes', value: 54,  icon: <Users size={22} />, accent: 'hsl(var(--brand-primary))' },
 *     { label: 'Activos',        value: 48,  icon: <Check size={22} />, accent: '#22c55e' },
 *     { label: 'Con teléfono',   value: 30,  icon: <Phone size={22} />, accent: '#8b5cf6' },
 *   ]} />
 */

import React from 'react';

export type KpiCardData = {
  label:   string;
  value:   number | string;
  icon?:   React.ReactNode;
  accent?: string;   // color del icono y del valor
};

type Props = {
  cards: KpiCardData[];
};

export function KpiCards({ cards }: Props) {
  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: `repeat(${cards.length}, 1fr)`,
      gap:                 12,
      marginBottom:        16,
    }}>
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            background:   'white',
            border:       '1px solid hsl(var(--border-default))',
            borderRadius: 10,
            padding:      '14px 16px',
            display:      'flex',
            alignItems:   'center',
            gap:          12,
          }}
        >
          {/* Icono en círculo tenue */}
          {card.icon && (
            <div style={{
              display:        'inline-flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          40,
              height:         40,
              borderRadius:   '50%',
              background:     card.accent
                ? `color-mix(in srgb, ${card.accent} 12%, transparent)`
                : 'hsl(var(--brand-primary) / 0.10)',
              color:          card.accent ?? 'hsl(var(--brand-primary))',
              flexShrink:     0,
            }}>
              {card.icon}
            </div>
          )}

          {/* Número + etiqueta */}
          <div>
            <div style={{
              fontSize:   24,
              fontWeight: 700,
              color:      card.accent ?? 'hsl(var(--text-primary))',
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize:   12,
              color:      'hsl(var(--text-muted))',
              marginTop:  2,
              whiteSpace: 'nowrap',
            }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KpiCards;

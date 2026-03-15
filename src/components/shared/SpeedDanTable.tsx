'use client';

/**
 * SpeedDanTable — Tabla genérica estilo Speeddansys ERP.
 *
 * Características:
 *  • Header: gradiente #fafbfd→#f4f5f8, uppercase 11px bold
 *  • Filas compactas con hover teal suave (#f0fdf9)
 *  • Acciones SIEMPRE VISIBLES: edit (teal outlined), delete (red outlined)
 *  • Skeleton shimmer mientras loading=true
 *  • Estado vacío con icono circulado
 *  • Columna # automática
 *  • Paginación cliente integrada (prop pageSize, default 10)
 */

import React, { useState, useEffect } from 'react';
import { PencilSimple, Trash, CaretLeft, CaretRight } from '@phosphor-icons/react';

// ── CSS inyectado ─────────────────────────────────────────────────────────
const TABLE_STYLES = `
  @keyframes speeddan-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .sk-cell {
    background: linear-gradient(90deg, #efefef 25%, #e2e2e2 50%, #efefef 75%);
    background-size: 600px 100%;
    animation: speeddan-shimmer 1.4s ease-in-out infinite;
    border-radius: 5px;
    display: block;
  }
  .tbl-row { transition: background 0.12s; }
  .tbl-row:hover { background: #f0fdf9 !important; }

  /* Botón Editar — teal outlined */
  .btn-edit {
    border-color: hsl(var(--brand-primary)) !important;
    color:        hsl(var(--brand-primary)) !important;
  }
  .btn-edit:hover {
    background: hsl(var(--brand-primary) / 0.10) !important;
  }

  /* Botón Eliminar — rojo outlined */
  .btn-del {
    border-color: #ef4444 !important;
    color:        #ef4444 !important;
  }
  .btn-del:hover {
    background: rgba(239,68,68,0.10) !important;
  }

  /* Paginación */
  .sd-pg-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 3px;
    height: 28px; min-width: 28px; padding: 0 8px;
    border-radius: 6px; border: 1px solid #e2e8f0;
    background: white; cursor: pointer;
    font-size: 12px; font-weight: 500;
    color: #4a5568; transition: all 0.15s; line-height: 1;
  }
  .sd-pg-btn:hover:not(:disabled) {
    border-color: hsl(var(--brand-primary));
    color:        hsl(var(--brand-primary));
    background:   hsl(var(--brand-primary) / 0.06);
  }
  .sd-pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .sd-pg-btn--active {
    background:   hsl(var(--brand-primary)) !important;
    color:        white                    !important;
    border-color: hsl(var(--brand-primary)) !important;
    font-weight:  600                      !important;
  }
`;

// ── Types ──────────────────────────────────────────────────────────────────

export type SpeedDanColumn<T> = {
  key:     string;
  label:   string;
  muted?:  boolean;
  width?:  string;
  align?:  'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
};

type Props<T extends { id: number }> = {
  items:       T[];
  columns:     SpeedDanColumn<T>[];
  loading?:    boolean;
  emptyIcon?:  React.ReactNode;
  emptyTitle?: string;
  emptyDesc?:  string;
  onEdit?:     (item: T) => void;
  onDelete?:   (item: T) => void;
  /** Items por página. 0 = sin paginación. Default: 10 */
  pageSize?:   number;
};

// ── Estilos inline ─────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding:       '11px 16px',
  textAlign:     'left',
  fontSize:      '11px',
  fontWeight:    700,
  color:         'hsl(var(--text-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.65px',
  background:    'linear-gradient(to bottom, #fafbfd, #f4f5f8)',
  borderBottom:  '2px solid hsl(var(--border-default))',
  whiteSpace:    'nowrap',
  userSelect:    'none',
};

const tdStyle: React.CSSProperties = {
  padding:       '10px 16px',
  fontSize:      '13.5px',
  color:         'hsl(var(--text-primary))',
  borderBottom:  '1px solid #f0f0f4',
  verticalAlign: 'middle',
};

const tdMutedStyle: React.CSSProperties = {
  ...tdStyle,
  fontSize: '12.5px',
  color:    'hsl(var(--text-muted))',
};

const actionBtnBase: React.CSSProperties = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  width:          '28px',
  height:         '28px',
  borderRadius:   '6px',
  border:         '1px solid',
  background:     'transparent',
  cursor:         'pointer',
  transition:     'background 0.15s',
  padding:        0,
  flexShrink:     0,
};

// ── Rango de páginas para la paginación ───────────────────────────────────

function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

// ── Componente ─────────────────────────────────────────────────────────────

function SpeedDanTable<T extends { id: number }>({
  items,
  columns,
  loading    = false,
  emptyIcon,
  emptyTitle = 'Sin registros',
  emptyDesc,
  onEdit,
  onDelete,
  pageSize   = 10,
}: Props<T>) {
  const hasActions = Boolean(onEdit || onDelete);
  const colCount   = 1 + columns.length + (hasActions ? 1 : 0);

  // Paginación interna
  const [page, setPage] = useState(1);
  // Resetear a página 1 cuando cambia el conjunto de items (búsqueda, etc.)
  useEffect(() => { setPage(1); }, [items.length]);

  const usePaging  = pageSize > 0 && items.length > pageSize;
  const pagedItems = usePaging ? items.slice((page - 1) * pageSize, page * pageSize) : items;
  const totalPages = usePaging ? Math.ceil(items.length / pageSize) : 1;
  const pageStart  = items.length === 0 ? 0 : usePaging ? (page - 1) * pageSize + 1 : 1;
  const pageEnd    = usePaging ? Math.min(page * pageSize, items.length) : items.length;

  return (
    <>
      <style suppressHydrationWarning>{TABLE_STYLES}</style>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>

          {/* ── Cabecera ─────────────────────────────── */}
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '46px', textAlign: 'center' }}>#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ ...thStyle, width: col.width, textAlign: col.align ?? 'left' }}
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>

            {/* ── Skeleton shimmer ─────────────────── */}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={`sk-${i}`} style={{ background: i % 2 === 0 ? '#ffffff' : '#fafafc' }}>
                {Array.from({ length: colCount }).map((__, j) => (
                  <td key={j} style={tdStyle}>
                    <span
                      className="sk-cell"
                      style={{
                        width:  j === 0 ? '26px' : j === 1 ? '120px' : j % 3 === 0 ? '90px' : '65px',
                        height: '12px',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}

            {/* ── Estado vacío ─────────────────────── */}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={colCount}>
                  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                    {emptyIcon && (
                      <div style={{
                        display:        'inline-flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        width:          '72px',
                        height:         '72px',
                        borderRadius:   '50%',
                        background:     'linear-gradient(135deg, #f0f0f0, #e8e8e8)',
                        color:          'hsl(var(--text-muted))',
                        marginBottom:   '16px',
                      }}>
                        {emptyIcon}
                      </div>
                    )}
                    <p style={{ fontWeight: 700, color: 'hsl(var(--text-secondary))', margin: '0 0 6px', fontSize: '14px' }}>
                      {emptyTitle}
                    </p>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0 }}>
                      {emptyDesc ?? 'Usa el botón + Nuevo para agregar el primer registro.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Filas de datos ───────────────────── */}
            {!loading && pagedItems.map((item, idx) => {
              const globalIdx = usePaging ? (page - 1) * pageSize + idx : idx;
              return (
                <tr
                  key={item.id}
                  className="tbl-row"
                  style={{ background: globalIdx % 2 === 0 ? '#ffffff' : '#fafafc' }}
                >
                  {/* # */}
                  <td style={{
                    ...tdStyle,
                    textAlign:          'center',
                    color:              'hsl(var(--text-muted))',
                    fontSize:           '11px',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {globalIdx + 1}
                  </td>

                  {/* Celdas */}
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{ ...(col.muted ? tdMutedStyle : tdStyle), textAlign: col.align ?? 'left' }}
                    >
                      {col.render
                        ? col.render(item)
                        : (
                            String((item as Record<string, unknown>)[col.key] ?? '').trim() ||
                            <span style={{ color: '#d0d0d0' }}>—</span>
                          )
                      }
                    </td>
                  ))}

                  {/* Acciones — siempre visibles, outlined */}
                  {hasActions && (
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {onEdit && (
                          <button
                            type="button"
                            className="btn-edit"
                            style={actionBtnBase}
                            title="Editar"
                            onClick={() => onEdit(item)}
                          >
                            <PencilSimple size={12} weight="bold" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="btn-del"
                            style={actionBtnBase}
                            title="Eliminar"
                            onClick={() => onDelete(item)}
                          >
                            <Trash size={12} weight="bold" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

          </tbody>
        </table>
      </div>

      {/* ── Paginación ──────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '10px 16px',
          borderTop:      '1px solid #f0f0f4',
          fontSize:       '12.5px',
          color:          'hsl(var(--text-muted))',
        }}>
          {/* Contador */}
          <span>
            {usePaging ? `${pageStart}–${pageEnd} de ${items.length}` : `${items.length} registro${items.length !== 1 ? 's' : ''}`}
          </span>

          {/* Controles de página */}
          {usePaging && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                className="sd-pg-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Página anterior"
              >
                <CaretLeft size={11} weight="bold" />
              </button>

              {getPageRange(page, totalPages).map((p, i) =>
                p === '...'
                  ? <span key={`e${i}`} style={{ padding: '0 2px', fontSize: 12, color: '#cbd5e0' }}>…</span>
                  : (
                    <button
                      key={p}
                      className={`sd-pg-btn${page === p ? ' sd-pg-btn--active' : ''}`}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </button>
                  )
              )}

              <button
                className="sd-pg-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Página siguiente"
              >
                <CaretRight size={11} weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export { SpeedDanTable };
export default SpeedDanTable;

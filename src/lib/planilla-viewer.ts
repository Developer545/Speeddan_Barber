/**
 * planilla-viewer.ts — Generador de HTML para comprobantes de planilla.
 * Uso exclusivo cliente (browser). Abre una nueva pestaña.
 * El usuario puede usar Ctrl+P > "Guardar como PDF".
 * Mismo patrón que dte-viewer.ts — sin generar PDFs pesados en servidor.
 */

export interface PlanillaDetalle {
  id: number
  nombre: string
  tipoPago: string
  unidades: number
  salarioBruto: number
  isss: number
  afp: number
  renta: number
  otrasDeducciones: number
  totalDeducciones: number
  salarioNeto: number
  isssPatronal: number
  afpPatronal: number
  insaforp: number
}

export interface PlanillaViewerData {
  id: number
  periodo: string
  estado: string
  totalBruto: number
  totalISS: number
  totalAFP: number
  totalRenta: number
  totalDeducciones: number
  totalNeto: number
  totalPatronalISS: number
  totalPatronalAFP: number
  totalINSAFORP: number
  detalles: PlanillaDetalle[]
}

const TIPO_PAGO_LABELS: Record<string, string> = {
  FIJO: 'Salario Fijo', POR_DIA: 'Por Día',
  POR_SEMANA: 'Por Semana', POR_HORA: 'Por Hora', POR_SERVICIO: 'Por Servicio',
}

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: 'BORRADOR', APROBADA: 'APROBADA', PAGADA: 'PAGADA',
}

const fmt = (n: number) => `$${Number(n || 0).toFixed(2)}`

// ─── Abrir planilla completa (A4) en nueva pestaña ───────────────────────────

export function abrirPlanillaPDF(data: PlanillaViewerData, negocio: string) {
  const html = generarHtmlPlanilla(data, negocio)
  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}

// ─── Abrir comprobante individual de barbero ──────────────────────────────────

export function abrirComprobanteBarbero(
  planilla: PlanillaViewerData,
  detalle: PlanillaDetalle,
  negocio: string,
) {
  const html = generarHtmlComprobante(planilla, detalle, negocio)
  const win = window.open('', '_blank', 'width=520,height=720,scrollbars=yes')
  if (win) { win.document.write(html); win.document.close() }
}

// ─── Planilla completa (A4) ───────────────────────────────────────────────────

function generarHtmlPlanilla(data: PlanillaViewerData, negocio: string): string {
  const totalPatronal = data.totalPatronalISS + data.totalPatronalAFP + data.totalINSAFORP
  const costoTotal    = data.totalBruto + totalPatronal
  const fechaHoy      = new Date().toLocaleDateString('es-SV', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const filasDetalles = data.detalles.map((d, i) => `
    <tr>
      <td style="text-align:center;color:#888">${i + 1}</td>
      <td><strong>${d.nombre}</strong><br><span style="color:#888;font-size:10px">${TIPO_PAGO_LABELS[d.tipoPago] || d.tipoPago}</span></td>
      <td style="text-align:right">${fmt(d.salarioBruto)}</td>
      <td style="text-align:right;color:#dc2626">${fmt(d.isss)}</td>
      <td style="text-align:right;color:#dc2626">${fmt(d.afp)}</td>
      <td style="text-align:right;color:#dc2626">${fmt(d.renta)}</td>
      <td style="text-align:right;color:#dc2626"><strong>${fmt(d.totalDeducciones)}</strong></td>
      <td style="text-align:right;color:#0d9488;font-weight:700">${fmt(d.salarioNeto)}</td>
      <td style="text-align:right;color:#6b7280;font-size:10px">${fmt(d.isssPatronal + d.afpPatronal + d.insaforp)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Planilla ${data.periodo} — ${negocio}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#222;background:#e5e7eb}
    @media print{
      body{background:#fff}
      .no-print{display:none!important}
      @page{size:A4 landscape;margin:8mm}
    }
    .toolbar{background:#1f2937;color:#fff;padding:10px 20px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}
    .toolbar span{flex:1;font-size:13px;font-weight:600}
    .btn{padding:7px 18px;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600}
    .btn-print{background:#0d9488;color:#fff}
    .btn-close{background:#6b7280;color:#fff}
    .page{width:297mm;min-height:210mm;background:#fff;margin:20px auto;padding:12mm 14mm;box-shadow:0 4px 16px rgba(0,0,0,0.15)}
    /* Header */
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;padding-bottom:14px;border-bottom:3px solid #0d9488}
    .negocio-nombre{font-size:22px;font-weight:800;color:#0d9488;margin-bottom:4px}
    .negocio-sub{font-size:11px;color:#555}
    .info-box{border:2px solid #0d9488;border-radius:8px;padding:10px 16px;text-align:right;min-width:200px}
    .info-tipo{font-size:15px;font-weight:800;color:#0d9488;letter-spacing:.5px}
    .info-periodo{font-size:18px;font-weight:800;color:#111;margin-top:3px}
    .info-estado{display:inline-block;margin-top:5px;padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.5px}
    .estado-BORRADOR{background:#f3f4f6;color:#374151}
    .estado-APROBADA{background:#dcfce7;color:#166534}
    .estado-PAGADA{background:#dbeafe;color:#1d4ed8}
    /* KPIs */
    .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px}
    .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px}
    .kpi-label{font-size:9px;color:#888;text-transform:uppercase;font-weight:700;letter-spacing:.5px;margin-bottom:3px}
    .kpi-value{font-size:16px;font-weight:800;color:#0d9488}
    .kpi-value.danger{color:#dc2626}
    .kpi-value.neutral{color:#374151}
    .kpi-value.amber{color:#d97706}
    /* Tabla */
    table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:14px}
    th{background:#0d9488;color:#fff;padding:7px 8px;text-align:left;font-size:9.5px;letter-spacing:.2px;white-space:nowrap}
    td{padding:7px 8px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
    tr:nth-child(even) td{background:#fafafa}
    .tfoot td{border-top:2px solid #0d9488;font-weight:700;background:#f0fdf4;padding:8px}
    /* Patron section */
    .patronal{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;margin-bottom:14px}
    .patronal-title{font-size:10px;font-weight:700;color:#92400e;margin-bottom:6px}
    .patronal-row{display:flex;gap:24px}
    .patronal-item{flex:1}
    .patronal-label{font-size:9px;color:#888;margin-bottom:2px}
    .patronal-val{font-size:13px;font-weight:700;color:#d97706}
    /* Footer */
    .footer{margin-top:16px;padding-top:10px;border-top:1px dashed #d1d5db;display:flex;justify-content:space-between;color:#9ca3af;font-size:9px}
    .firmas{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:30px}
    .firma-line{border-top:1px solid #374151;padding-top:4px;text-align:center;font-size:10px;color:#555}
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <span>📋 Planilla ${data.periodo} — ${negocio}</span>
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir / PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Cerrar</button>
  </div>

  <div class="page">
    <div class="header">
      <div>
        <div class="negocio-nombre">✂ ${negocio}</div>
        <div class="negocio-sub">Planilla Salarial — Empleados</div>
        <div class="negocio-sub" style="margin-top:4px;color:#9ca3af">Generado el: ${fechaHoy}</div>
      </div>
      <div class="info-box">
        <div class="info-tipo">PLANILLA SALARIAL</div>
        <div class="info-periodo">${data.periodo}</div>
        <span class="info-estado estado-${data.estado}">${ESTADO_LABEL[data.estado] || data.estado}</span>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi">
        <div class="kpi-label">Total Bruto</div>
        <div class="kpi-value neutral">${fmt(data.totalBruto)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Total Deducciones</div>
        <div class="kpi-value danger">${fmt(data.totalDeducciones)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Total Neto a Pagar</div>
        <div class="kpi-value">${fmt(data.totalNeto)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Costo Patronal</div>
        <div class="kpi-value amber">${fmt(totalPatronal)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Costo Total Empresa</div>
        <div class="kpi-value neutral">${fmt(costoTotal)}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:28px;text-align:center">#</th>
          <th>Empleado</th>
          <th style="text-align:right">Bruto</th>
          <th style="text-align:right">ISSS Emp.</th>
          <th style="text-align:right">AFP Emp.</th>
          <th style="text-align:right">Renta</th>
          <th style="text-align:right">Total Ded.</th>
          <th style="text-align:right">Neto a Pagar</th>
          <th style="text-align:right">Costo Pat.</th>
        </tr>
      </thead>
      <tbody>${filasDetalles}</tbody>
      <tfoot>
        <tr class="tfoot">
          <td colspan="2">TOTALES (${data.detalles.length} empleados)</td>
          <td style="text-align:right">${fmt(data.totalBruto)}</td>
          <td style="text-align:right;color:#dc2626">${fmt(data.totalISS)}</td>
          <td style="text-align:right;color:#dc2626">${fmt(data.totalAFP)}</td>
          <td style="text-align:right;color:#dc2626">${fmt(data.totalRenta)}</td>
          <td style="text-align:right;color:#dc2626">${fmt(data.totalDeducciones)}</td>
          <td style="text-align:right;color:#0d9488;font-size:13px">${fmt(data.totalNeto)}</td>
          <td style="text-align:right;color:#d97706">${fmt(totalPatronal)}</td>
        </tr>
      </tfoot>
    </table>

    <div class="patronal">
      <div class="patronal-title">⚠ Aportes Patronales (cargo de la empresa — no se descuentan al empleado)</div>
      <div class="patronal-row">
        <div class="patronal-item">
          <div class="patronal-label">ISSS Patronal</div>
          <div class="patronal-val">${fmt(data.totalPatronalISS)}</div>
        </div>
        <div class="patronal-item">
          <div class="patronal-label">AFP Patronal</div>
          <div class="patronal-val">${fmt(data.totalPatronalAFP)}</div>
        </div>
        <div class="patronal-item">
          <div class="patronal-label">INSAFORP / INCAF</div>
          <div class="patronal-val">${fmt(data.totalINSAFORP)}</div>
        </div>
        <div class="patronal-item">
          <div class="patronal-label">Total Patronal</div>
          <div class="patronal-val">${fmt(totalPatronal)}</div>
        </div>
        <div class="patronal-item">
          <div class="patronal-label">Costo Total Empresa</div>
          <div class="patronal-val" style="color:#b45309;font-size:16px">${fmt(costoTotal)}</div>
        </div>
      </div>
    </div>

    <div class="firmas">
      <div class="firma-line">Elaborado por</div>
      <div class="firma-line">Revisado por</div>
      <div class="firma-line">Autorizado por</div>
    </div>

    <div class="footer">
      <span>Planilla #${data.id} — Período: ${data.periodo} — Estado: ${ESTADO_LABEL[data.estado] || data.estado}</span>
      <span>${negocio} | Generado con Speeddan ERP</span>
    </div>
  </div>
</body>
</html>`
}

// ─── Comprobante individual (recibo de pago por barbero) ──────────────────────

function generarHtmlComprobante(
  planilla: PlanillaViewerData,
  d: PlanillaDetalle,
  negocio: string,
): string {
  const fechaHoy = new Date().toLocaleDateString('es-SV', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante — ${d.nombre} — ${planilla.periodo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#222;background:#e5e7eb}
    @media print{
      body{background:#fff}
      .no-print{display:none!important}
      @page{size:A5;margin:10mm}
    }
    .toolbar{background:#1f2937;color:#fff;padding:8px 14px;display:flex;align-items:center;gap:8px;position:sticky;top:0}
    .toolbar span{flex:1;font-size:12px}
    .btn{padding:6px 14px;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-weight:600}
    .btn-print{background:#0d9488;color:#fff}
    .btn-close{background:#6b7280;color:#fff}
    .slip{width:420px;background:#fff;margin:20px auto;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.15)}
    /* Header */
    .slip-header{text-align:center;border-bottom:3px solid #0d9488;padding-bottom:12px;margin-bottom:14px}
    .slip-negocio{font-size:18px;font-weight:800;color:#0d9488}
    .slip-titulo{font-size:12px;font-weight:700;color:#555;margin-top:3px;text-transform:uppercase;letter-spacing:.5px}
    .slip-periodo{font-size:22px;font-weight:800;color:#111;margin-top:6px}
    /* Empleado */
    .emp-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin-bottom:14px}
    .emp-nombre{font-size:15px;font-weight:800;color:#166534}
    .emp-tipo{font-size:11px;color:#555;margin-top:2px}
    /* Secciones */
    .seccion{margin-bottom:12px}
    .sec-titulo{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;border-bottom:1px solid #f0f0f0;padding-bottom:3px}
    .fila{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #f3f4f6;font-size:11.5px}
    .fila:last-child{border-bottom:none}
    .fila.total{border-top:2px solid #0d9488;border-bottom:none;margin-top:4px;padding-top:6px;font-size:16px;font-weight:800;color:#0d9488}
    .fila.ded{color:#dc2626}
    /* Firma */
    .firma-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:24px}
    .firma-line{border-top:1px solid #374151;padding-top:4px;text-align:center;font-size:10px;color:#888}
    /* Footer */
    .slip-footer{text-align:center;color:#9ca3af;font-size:9px;margin-top:14px;border-top:1px dashed #e5e7eb;padding-top:8px}
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <span>🧾 Comprobante de Pago — ${d.nombre}</span>
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir</button>
    <button class="btn btn-close" onclick="window.close()">✕</button>
  </div>

  <div class="slip">
    <div class="slip-header">
      <div class="slip-negocio">✂ ${negocio}</div>
      <div class="slip-titulo">Comprobante de Pago Salarial</div>
      <div class="slip-periodo">${planilla.periodo}</div>
      <div style="font-size:10px;color:#9ca3af;margin-top:3px">Emitido el ${fechaHoy}</div>
    </div>

    <div class="emp-box">
      <div class="emp-nombre">${d.nombre}</div>
      <div class="emp-tipo">${TIPO_PAGO_LABELS[d.tipoPago] || d.tipoPago}${d.unidades > 0 ? ` · ${d.unidades} unidades` : ''}</div>
    </div>

    <div class="seccion">
      <div class="sec-titulo">Ingresos</div>
      <div class="fila">
        <span>Salario Bruto</span>
        <span><strong>${fmt(d.salarioBruto)}</strong></span>
      </div>
    </div>

    <div class="seccion">
      <div class="sec-titulo">Deducciones Empleado</div>
      <div class="fila ded">
        <span>ISSS (Seguro Social)</span>
        <span>- ${fmt(d.isss)}</span>
      </div>
      <div class="fila ded">
        <span>AFP (Fondo de Pensiones)</span>
        <span>- ${fmt(d.afp)}</span>
      </div>
      ${d.renta > 0 ? `<div class="fila ded"><span>Renta / ISR</span><span>- ${fmt(d.renta)}</span></div>` : ''}
      ${d.otrasDeducciones > 0 ? `<div class="fila ded"><span>Otras Deducciones</span><span>- ${fmt(d.otrasDeducciones)}</span></div>` : ''}
      <div class="fila ded" style="font-weight:700;border-top:1px solid #fecaca;padding-top:5px;margin-top:2px">
        <span>Total Deducciones</span>
        <span>- ${fmt(d.totalDeducciones)}</span>
      </div>
    </div>

    <div class="fila total">
      <span>SALARIO NETO</span>
      <span>${fmt(d.salarioNeto)}</span>
    </div>

    <div class="seccion" style="margin-top:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:5px;padding:8px 10px">
      <div class="sec-titulo" style="color:#92400e">Aportes Patronales (cargo empresa)</div>
      <div class="fila" style="font-size:10.5px">
        <span>ISSS Pat. + AFP Pat. + INSAFORP</span>
        <span style="color:#d97706">${fmt(d.isssPatronal + d.afpPatronal + d.insaforp)}</span>
      </div>
    </div>

    <div class="firma-grid">
      <div class="firma-line">Firma Empleador</div>
      <div class="firma-line">Firma Empleado — ${d.nombre}</div>
    </div>

    <div class="slip-footer">
      Planilla #${planilla.id} · ${planilla.periodo} · ${negocio} · Speeddan ERP
    </div>
  </div>
</body>
</html>`
}

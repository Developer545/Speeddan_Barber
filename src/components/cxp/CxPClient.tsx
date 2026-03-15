'use client';

// ══════════════════════════════════════════════════════════
// CUENTAS POR PAGAR — Ant Design 5 Client Component
// KPIs con bordes de color, Alert de vencidas, Tabs por estado,
// Drawer de detalle con historial, Modal de pago
// ══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Table, Card, Button, Row, Col,
  Statistic, Tag, Modal, Input,
  Typography, Tabs, Drawer, Select,
  Space, Alert, Descriptions, Badge,
  Avatar, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DollarOutlined, EyeOutlined,
  ExclamationCircleOutlined, WarningOutlined,
  CheckCircleOutlined,
  WalletOutlined, CreditCardOutlined,
  BankOutlined, QrcodeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { FormField } from '@/components/shared/FormField';

const { Text } = Typography;

// ── Tipos ──────────────────────────────────────────────────────────────────────

type EstadoCxP = 'VENCIDA' | 'POR_VENCER' | 'VIGENTE' | 'PAGADA';

type PagoCxP = {
  id: number;
  monto: number;
  metodoPago: string;
  referencia: string | null;
  notas: string | null;
  fecha: string;
  createdAt: string;
};

type DetalleCxP = {
  id: number;
  descripcion: string | null;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  producto: { id: number; codigo: string; nombre: string; unidadMedida: string } | null;
};

type CxPItem = {
  id: number;
  numeroDocumento: string;
  tipoDocumento: string;
  condicionPago: string;
  fecha: string;
  total: number;
  subtotal: number;
  iva: number;
  estado: string;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  proveedor: {
    id: number;
    nombre: string;
    telefono: string | null;
    correo: string | null;
    plazoCredito: number;
  } | null;
  pagos: PagoCxP[];
  detalles: DetalleCxP[];
  totalAbonado: number;
  saldo: number;
  fechaVencimiento: string;
  diasRestantes: number;
  estadoCxP: EstadoCxP;
};

type Resumen = {
  totalDocumentos: number;
  totalMonto: number;
  montoVencido: number;
  montoPorVencer: number;
  montoVigente: number;
  countVencidas: number;
  countPorVencer: number;
  countVigentes: number;
  countPagadas: number;
};

type Props = {
  initialList:    CxPItem[];
  initialResumen: Resumen;
};

// ── Constantes ─────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoCxP, { color: string; label: string; tagColor: string }> = {
  VENCIDA:    { color: '#ef4444', label: 'Vencida',    tagColor: 'error' },
  POR_VENCER: { color: '#f59e0b', label: 'Por vencer', tagColor: 'warning' },
  VIGENTE:    { color: '#10b981', label: 'Vigente',    tagColor: 'success' },
  PAGADA:     { color: '#6b7280', label: 'Pagada',     tagColor: 'default' },
};

const METODO_LABELS: Record<string, string> = {
  CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia', QR: 'QR',
};

const METODO_ICONS: Record<string, React.ReactNode> = {
  CASH:     <WalletOutlined />,
  CARD:     <CreditCardOutlined />,
  TRANSFER: <BankOutlined />,
  QR:       <QrcodeOutlined />,
};

const TIPO_DOC_COLORS: Record<string, string> = {
  FACTURA: 'blue', CCF: 'purple', RECIBO: 'cyan', TICKET: 'green', NOTA: 'orange',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMoney(n: number) { return `$${n.toFixed(2)}`; }

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function diasRestantesLabel(dias: number) {
  if (dias < 0)  return `Vencida hace ${Math.abs(dias)} días`;
  if (dias === 0) return 'Vence hoy';
  return `${dias} días`;
}

function diasColor(dias: number, estado: EstadoCxP) {
  if (estado === 'PAGADA') return '#6b7280';
  if (dias < 0)  return '#ef4444';
  if (dias <= 5) return '#f59e0b';
  return '#10b981';
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function CxPClient({ initialList, initialResumen }: Props) {
  const [list,    setList]    = useState<CxPItem[]>(initialList);
  const [resumen, setResumen] = useState<Resumen>(initialResumen);

  // Tabs
  const [activeTab, setActiveTab] = useState<string>('TODAS');

  // Drawer detalle
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected,   setSelected]   = useState<CxPItem | null>(null);

  // Modal pago
  const [pagoOpen,   setPagoOpen]   = useState(false);
  const [pagoMonto,  setPagoMonto]  = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('CASH');
  const [pagoRef,    setPagoRef]    = useState('');
  const [pagoNotas,  setPagoNotas]  = useState('');
  const [savingPago, setSavingPago] = useState(false);
  const [pagoError,  setPagoError]  = useState('');

  // ── Filtrado por tab ────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    if (activeTab === 'TODAS') return list;
    return list.filter(c => c.estadoCxP === activeTab);
  }, [list, activeTab]);

  // ── Detalle ─────────────────────────────────────────────────────────────────

  function openDetail(item: CxPItem) {
    setSelected(item);
    setDrawerOpen(true);
  }

  function openPago(item: CxPItem) {
    setSelected(item);
    setPagoMonto(item.saldo.toFixed(2));
    setPagoMetodo('CASH'); setPagoRef(''); setPagoNotas('');
    setPagoError('');
    setPagoOpen(true);
  }

  // ── Registrar pago ──────────────────────────────────────────────────────────

  async function handlePago() {
    if (!selected) return;
    if (!pagoMonto || Number(pagoMonto) <= 0) {
      setPagoError('El monto debe ser mayor a 0'); return;
    }
    if (Number(pagoMonto) > selected.saldo + 0.009) {
      setPagoError(`El monto supera el saldo ($${selected.saldo.toFixed(2)})`); return;
    }

    setSavingPago(true); setPagoError('');

    try {
      const res = await fetch(`/api/cxp/${selected.id}/pago`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          monto:      Number(pagoMonto),
          metodoPago: pagoMetodo,
          referencia: pagoRef || null,
          notas:      pagoNotas || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error?.message ?? 'Error al registrar pago';
        setPagoError(msg); toast.error(msg); return;
      }

      const nuevoPago: PagoCxP = json.data;
      const monto = Number(pagoMonto);

      // Actualizar la lista optimistamente
      setList(prev => prev.map(item => {
        if (item.id !== selected.id) return item;
        const nuevoAbonado = item.totalAbonado + monto;
        const nuevoSaldo   = Math.max(0, item.total - nuevoAbonado);
        let nuevoEstado: EstadoCxP = item.estadoCxP;
        if (nuevoSaldo <= 0.009) nuevoEstado = 'PAGADA';

        return {
          ...item,
          pagos: [nuevoPago, ...item.pagos],
          totalAbonado: nuevoAbonado,
          saldo: nuevoSaldo,
          estadoCxP: nuevoEstado,
          estado: nuevoSaldo <= 0.009 ? 'PAGADA' : item.estado,
        };
      }));

      // Actualizar el item seleccionado en el drawer
      setSelected(prev => {
        if (!prev) return prev;
        const nuevoAbonado = prev.totalAbonado + monto;
        const nuevoSaldo   = Math.max(0, prev.total - nuevoAbonado);
        return {
          ...prev,
          pagos:        [nuevoPago, ...prev.pagos],
          totalAbonado: nuevoAbonado,
          saldo:         nuevoSaldo,
          estadoCxP:     nuevoSaldo <= 0.009 ? 'PAGADA' : prev.estadoCxP,
        };
      });

      // Actualizar resumen
      setResumen(prev => ({
        ...prev,
        montoVencido:   Math.max(0, prev.montoVencido   - (selected.estadoCxP === 'VENCIDA'    ? monto : 0)),
        montoPorVencer: Math.max(0, prev.montoPorVencer - (selected.estadoCxP === 'POR_VENCER' ? monto : 0)),
        montoVigente:   Math.max(0, prev.montoVigente   - (selected.estadoCxP === 'VIGENTE'    ? monto : 0)),
      }));

      toast.success(`Pago de ${formatMoney(monto)} registrado`);
      setPagoOpen(false);
    } catch {
      setPagoError('Error de red'); toast.error('Error de red');
    } finally { setSavingPago(false); }
  }

  // ── Columnas ────────────────────────────────────────────────────────────────

  const columns: ColumnsType<CxPItem> = [
    {
      title:  'Proveedor',
      key:    'proveedor',
      render: (_, r) => (
        <Space size={10}>
          <Avatar
            style={{ background: '#0d9488', fontSize: 11, fontWeight: 700, flexShrink: 0 }}
            size={34}
          >
            {r.proveedor ? getInitials(r.proveedor.nombre) : '?'}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13, lineHeight: '18px' }}>
              {r.proveedor?.nombre ?? 'Sin proveedor'}
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Plazo: {r.proveedor?.plazoCredito ?? 0} días
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title:  'Documento',
      key:    'documento',
      width:  160,
      render: (_, r) => (
        <div>
          <Tag color={TIPO_DOC_COLORS[r.tipoDocumento] ?? 'default'} style={{ fontSize: 10 }}>
            {r.tipoDocumento}
          </Tag>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2 }}>{r.numeroDocumento}</div>
        </div>
      ),
    },
    {
      title:      'Emisión',
      key:        'fecha',
      width:      100,
      responsive: ['md'],
      render:     (_, r) => <Text style={{ fontSize: 12 }}>{formatFecha(r.fecha)}</Text>,
    },
    {
      title:  'Vencimiento',
      key:    'vencimiento',
      width:  110,
      render: (_, r) => (
        <Text style={{ fontSize: 12, color: diasColor(r.diasRestantes, r.estadoCxP) }}>
          {formatFecha(r.fechaVencimiento)}
        </Text>
      ),
    },
    {
      title:  'Días',
      key:    'dias',
      width:  120,
      render: (_, r) => (
        <Text style={{ fontSize: 12, fontWeight: 500, color: diasColor(r.diasRestantes, r.estadoCxP) }}>
          {r.estadoCxP === 'PAGADA' ? '—' : diasRestantesLabel(r.diasRestantes)}
        </Text>
      ),
      sorter: (a, b) => a.diasRestantes - b.diasRestantes,
    },
    {
      title:  'Total',
      key:    'total',
      width:  100,
      align:  'right',
      render: (_, r) => (
        <Text style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(r.total)}
        </Text>
      ),
    },
    {
      title:      'Abonado',
      key:        'abonado',
      width:      100,
      align:      'right',
      responsive: ['lg'],
      render:     (_, r) => (
        <Text style={{ fontSize: 13, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(r.totalAbonado)}
        </Text>
      ),
    },
    {
      title:  'Saldo',
      key:    'saldo',
      width:  100,
      align:  'right',
      render: (_, r) => (
        <Text strong style={{
          fontSize: 14,
          fontVariantNumeric: 'tabular-nums',
          color: r.saldo > 0 ? '#ef4444' : '#10b981',
        }}>
          {formatMoney(r.saldo)}
        </Text>
      ),
      sorter: (a, b) => a.saldo - b.saldo,
    },
    {
      title:  'Estado',
      key:    'estado',
      width:  110,
      render: (_, r) => {
        const cfg = ESTADO_CONFIG[r.estadoCxP];
        return (
          <Tag color={cfg.tagColor} style={{ fontWeight: 500 }}>
            {cfg.label}
          </Tag>
        );
      },
      filters: [
        { text: 'Vencida',    value: 'VENCIDA' },
        { text: 'Por vencer', value: 'POR_VENCER' },
        { text: 'Vigente',    value: 'VIGENTE' },
        { text: 'Pagada',     value: 'PAGADA' },
      ],
      onFilter: (value, record) => record.estadoCxP === value,
    },
    {
      title:  'Acciones',
      key:    'acciones',
      width:  70,
      align:  'center',
      render: (_, r) => (
        <Button
          type="text" size="small" icon={<EyeOutlined />}
          onClick={() => openDetail(r)}
        />
      ),
    },
  ];

  // ── Tabs ────────────────────────────────────────────────────────────────────

  const tabItems = [
    {
      key:   'TODAS',
      label: `Todas (${list.length})`,
    },
    {
      key:   'VENCIDA',
      label: (
        <Badge count={resumen.countVencidas} color="#ef4444" size="small" offset={[6, -2]}>
          <span>Vencidas</span>
        </Badge>
      ),
    },
    {
      key:   'POR_VENCER',
      label: (
        <Badge count={resumen.countPorVencer} color="#f59e0b" size="small" offset={[6, -2]}>
          <span>Por vencer</span>
        </Badge>
      ),
    },
    {
      key:   'VIGENTE',
      label: `Vigentes (${resumen.countVigentes})`,
    },
    {
      key:   'PAGADA',
      label: `Pagadas (${resumen.countPagadas})`,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── KPIs ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} md={8} lg={4}>
          <Card size="small" style={{ borderTop: '3px solid #0d9488' }}>
            <Statistic
              title="Total documentos"
              value={resumen.totalDocumentos}
              prefix={<FileTextOutlined style={{ color: '#0d9488' }} />}
              valueStyle={{ color: '#0d9488', fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card size="small" style={{ borderTop: '3px solid #6366f1' }}>
            <Statistic
              title="Monto total"
              value={resumen.totalMonto}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#6366f1', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card size="small" style={{ borderTop: '3px solid #ef4444' }}>
            <Statistic
              title="Vencido"
              value={resumen.montoVencido}
              precision={2}
              prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{ color: '#ef4444', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card size="small" style={{ borderTop: '3px solid #f59e0b' }}>
            <Statistic
              title="Por vencer (0–5 días)"
              value={resumen.montoPorVencer}
              precision={2}
              prefix={<WarningOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card size="small" style={{ borderTop: '3px solid #10b981' }}>
            <Statistic
              title="Vigente"
              value={resumen.montoVigente}
              precision={2}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Alert de vencidas ── */}
      {resumen.countVencidas > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Text strong>
              Tienes {resumen.countVencidas} {resumen.countVencidas === 1 ? 'factura vencida' : 'facturas vencidas'} por {formatMoney(resumen.montoVencido)}
            </Text>
          }
          description="Regulariza estos pagos a la brevedad para evitar problemas con tus proveedores."
        />
      )}

      {/* ── Tabla principal ── */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          items={tabItems}
          tabBarStyle={{ marginBottom: 0 }}
        />

        <Table
          dataSource={filteredList}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 900 }}
          style={{ marginTop: 8 }}
          onRow={r => ({
            onClick: () => openDetail(r),
            style:   { cursor: 'pointer' },
          })}
          rowClassName={r =>
            r.estadoCxP === 'VENCIDA'
              ? 'ant-table-row-vencida'
              : r.estadoCxP === 'POR_VENCER'
              ? 'ant-table-row-por-vencer'
              : ''
          }
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ['15', '30', '50'],
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} documentos`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981' }} />
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  No hay cuentas por pagar en este estado
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Drawer: Detalle CxP ── */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#0d9488' }} />
            <span>Detalle de la cuenta por pagar</span>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          selected && selected.saldo > 0 && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => { setDrawerOpen(false); openPago(selected); }}
            >
              Registrar pago
            </Button>
          )
        }
      >
        {selected && (
          <>
            {/* Resumen de montos */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 4 }}>
                <Tag color={ESTADO_CONFIG[selected.estadoCxP].tagColor} style={{ fontSize: 13, padding: '2px 10px' }}>
                  {ESTADO_CONFIG[selected.estadoCxP].label}
                </Tag>
              </div>
              <Row gutter={0} style={{ marginTop: 12 }}>
                <Col span={8} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>Total</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{formatMoney(selected.total)}</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>Abonado</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#10b981' }}>{formatMoney(selected.totalAbonado)}</div>
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>Saldo</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: selected.saldo > 0 ? '#ef4444' : '#10b981' }}>
                    {formatMoney(selected.saldo)}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Información general */}
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Proveedor">
                <Text strong>{selected.proveedor?.nombre ?? '—'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Documento">
                <Tag color={TIPO_DOC_COLORS[selected.tipoDocumento] ?? 'default'}>
                  {selected.tipoDocumento}
                </Tag>{' '}
                {selected.numeroDocumento}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha emisión">
                {formatFecha(selected.fecha)}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha vencimiento">
                <span style={{ color: diasColor(selected.diasRestantes, selected.estadoCxP), fontWeight: 500 }}>
                  {formatFecha(selected.fechaVencimiento)}
                  {selected.estadoCxP !== 'PAGADA' && (
                    <span style={{ marginLeft: 8, fontSize: 11 }}>
                      ({diasRestantesLabel(selected.diasRestantes)})
                    </span>
                  )}
                </span>
              </Descriptions.Item>
              {selected.notas && (
                <Descriptions.Item label="Notas">
                  <Text type="secondary" style={{ fontSize: 12 }}>{selected.notas}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Historial de pagos */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13 }}>
                Historial de pagos ({selected.pagos.length})
              </Text>
              {selected.pagos.length === 0 ? (
                <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
                  Sin pagos registrados
                </div>
              ) : (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.pagos.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #f0f0f0', background: '#fafafa',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#f0fdfa', color: '#0d9488',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, marginRight: 10, flexShrink: 0,
                      }}>
                        {METODO_ICONS[p.metodoPago]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#10b981' }}>
                          {formatMoney(p.monto)}
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                          {METODO_LABELS[p.metodoPago] ?? p.metodoPago} · {formatFecha(p.fecha)}
                        </div>
                        {p.referencia && (
                          <div style={{ fontSize: 11, color: '#8c8c8c' }}>Ref: {p.referencia}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected.saldo > 0 && (
              <>
                <Divider />
                <Button
                  type="primary"
                  block
                  icon={<DollarOutlined />}
                  onClick={() => { setDrawerOpen(false); openPago(selected); }}
                >
                  Registrar pago ({formatMoney(selected.saldo)})
                </Button>
              </>
            )}
          </>
        )}
      </Drawer>

      {/* ── Modal: Registrar pago ── */}
      <Modal
        open={pagoOpen}
        onCancel={() => setPagoOpen(false)}
        title={
          <Space>
            <DollarOutlined style={{ color: '#0d9488' }} />
            <span>Registrar pago</span>
          </Space>
        }
        footer={null}
        destroyOnHidden
        width={440}
      >
        {selected && (
          <div style={{ paddingTop: 4 }}>
            {/* Resumen rápido */}
            <Card
              size="small"
              style={{ background: '#f0fdfa', border: '1px solid #99f6e4', marginBottom: 16 }}
            >
              <Row gutter={[8, 0]}>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Proveedor</div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>
                    {selected.proveedor?.nombre ?? '—'}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Saldo pendiente</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#ef4444' }}>
                    {formatMoney(selected.saldo)}
                  </div>
                </Col>
              </Row>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Row gutter={12}>
                <Col span={12}>
                  <FormField label="Monto ($) *">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selected.saldo}
                      prefix="$"
                      value={pagoMonto}
                      onChange={e => setPagoMonto(e.target.value)}
                      placeholder="0.00"
                    />
                  </FormField>
                </Col>
                <Col span={12}>
                  <FormField label="Método *">
                    <Select
                      style={{ width: '100%' }}
                      value={pagoMetodo}
                      onChange={v => setPagoMetodo(v)}
                      options={[
                        { value: 'CASH',     label: 'Efectivo' },
                        { value: 'CARD',     label: 'Tarjeta' },
                        { value: 'TRANSFER', label: 'Transferencia' },
                        { value: 'QR',       label: 'QR' },
                      ]}
                    />
                  </FormField>
                </Col>
              </Row>

              <FormField label="Referencia / Cheque No.">
                <Input
                  value={pagoRef}
                  onChange={e => setPagoRef(e.target.value)}
                  placeholder="Número de referencia o cheque"
                  maxLength={100}
                />
              </FormField>

              <FormField label="Notas">
                <Input
                  value={pagoNotas}
                  onChange={e => setPagoNotas(e.target.value)}
                  placeholder="Observaciones opcionales"
                  maxLength={300}
                />
              </FormField>

              {pagoError && (
                <p style={{ color: '#ff4d4f', fontSize: 13, margin: 0 }}>{pagoError}</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button onClick={() => setPagoOpen(false)}>Cancelar</Button>
              <Button
                type="primary"
                loading={savingPago}
                onClick={handlePago}
                disabled={!pagoMonto || Number(pagoMonto) <= 0}
              >
                {savingPago ? 'Registrando...' : 'Confirmar pago'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

'use client';

// ══════════════════════════════════════════════════════════
// CAJA — CRUD COMPLETO (patrón Speeddansys ERP)
// ══════════════════════════════════════════════════════════

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Table, Card, Button, Row, Col,
  Statistic, Tag, Select, Modal, Input,
  Typography, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DollarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, WarningOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { FormField } from '@/components/shared/FormField';

const { Title, Text } = Typography;

// ── Tipos ──────────────────────────────────────────────────────────────────

type UnpaidAppointment = {
  id: number; startTime: string;
  client:  { id: number; fullName: string };
  barber:  { user: { fullName: string } };
  service: { id: number; name: string; price: number };
};

type Payment = {
  id: number; amount: number; method: string; status: string;
  paidAt: string | null; createdAt: string; notes: string | null;
  appointment: {
    id: number; startTime: string;
    client:  { id: number; fullName: string };
    barber:  { user: { fullName: string } };
    service: { id: number; name: string };
  };
};

type Stats = {
  ingresosHoy: number; ingresosMes: number;
  pendienteSum: number; pendienteCount: number;
};

// ── Helpers ───────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia', QR: 'QR',
};
const STATUS_COLORS: Record<string, string> = {
  PAID: 'success', PENDING: 'warning', REFUNDED: 'error',
};
const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado', PENDING: 'Pendiente', REFUNDED: 'Reembolsado',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatMoney(n: number) { return `$${n.toFixed(2)}`; }

// ── Componente ────────────────────────────────────────────

type Props = {
  initialPayments: Payment[];
  initialUnpaid:   UnpaidAppointment[];
  initialStats:    Stats;
};

export default function BillingClient({ initialPayments, initialUnpaid, initialStats }: Props) {
  const [payments,     setPayments]     = useState<Payment[]>(initialPayments);
  const [unpaid,       setUnpaid]       = useState<UnpaidAppointment[]>(initialUnpaid);
  const [stats,        setStats]        = useState<Stats>(initialStats);
  const [open,         setOpen]         = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  // Form state
  const [apptId, setApptId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes,  setNotes]  = useState('');

  function onApptSelect(v: string) {
    setApptId(v);
    const appt = unpaid.find(a => String(a.id) === v);
    if (appt) setAmount(String(appt.service.price));
  }

  function openRegister() {
    setApptId(''); setAmount(''); setMethod('CASH'); setNotes(''); setError(''); setOpen(true);
  }

  async function handleSubmit() {
    if (!apptId || !amount) { setError('Selecciona una cita y monto'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: Number(apptId),
          amount:        parseFloat(amount),
          method,
          notes:         notes || undefined,
          status:        'PAID',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error?.message ?? 'Error al registrar pago';
        setError(msg); toast.error(msg); return;
      }
      setPayments(prev => [json.data, ...prev]);
      setUnpaid(prev => prev.filter(a => a.id !== Number(apptId)));
      setStats(prev => ({
        ...prev,
        ingresosHoy:    prev.ingresosHoy    + parseFloat(amount),
        ingresosMes:    prev.ingresosMes    + parseFloat(amount),
        pendienteCount: Math.max(0, prev.pendienteCount - 1),
      }));
      setOpen(false);
      toast.success(`Pago de ${formatMoney(parseFloat(amount))} registrado`);
    } catch {
      setError('Error de red'); toast.error('Error de red');
    } finally { setLoading(false); }
  }

  const filtered = filterStatus ? payments.filter(p => p.status === filterStatus) : payments;

  // ── Columnas ─────────────────────────────────────────────
  const columns: ColumnsType<Payment> = [
    {
      title:  'Cliente',
      key:    'cliente',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.appointment.client.fullName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.appointment.service.name}</Text>
        </div>
      ),
    },
    {
      title:  'Barbero',
      key:    'barbero',
      render: (_, r) => <Text type="secondary" style={{ fontSize: 13 }}>{r.appointment.barber.user.fullName}</Text>,
    },
    {
      title:  'Método',
      key:    'method',
      width:  120,
      render: (_, r) => <Tag style={{ fontSize: 11 }}>{METHOD_LABELS[r.method] ?? r.method}</Tag>,
    },
    {
      title:  'Monto',
      key:    'amount',
      width:  100,
      align:  'right',
      render: (_, r) => (
        <Text strong style={{ fontVariantNumeric: 'tabular-nums', color: '#52c41a' }}>
          {formatMoney(r.amount)}
        </Text>
      ),
    },
    {
      title:  'Estado',
      key:    'status',
      width:  110,
      render: (_, r) => (
        <Tag color={STATUS_COLORS[r.status] ?? 'default'}>{STATUS_LABELS[r.status] ?? r.status}</Tag>
      ),
    },
    {
      title:  'Fecha cita',
      key:    'startTime',
      width:  160,
      render: (_, r) => <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(r.appointment.startTime)}</Text>,
    },
    {
      title:  'Fecha pago',
      key:    'paidAt',
      width:  160,
      render: (_, r) => <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(r.paidAt)}</Text>,
    },
  ];

  return (
    <>
      {/* ── KPIs ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Ingresos hoy" value={stats.ingresosHoy} precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Ingresos mes" value={stats.ingresosMes} precision={2}
              prefix={<CheckCircleOutlined style={{ color: '#0d9488' }} />} valueStyle={{ color: '#0d9488' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Pendiente ($)" value={stats.pendienteSum} precision={2}
              prefix={<WarningOutlined style={{ color: '#f59e0b' }} />} valueStyle={{ color: '#f59e0b' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Citas pendientes" value={stats.pendienteCount}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />} />
          </Card>
        </Col>
      </Row>

      {/* ── Tabla ── */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Registro de pagos</Title>}
        extra={
          unpaid.length > 0 && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openRegister}>
              Registrar pago ({unpaid.length})
            </Button>
          )
        }
      >
        {/* Filtro */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Select style={{ width: '100%' }} placeholder="Todos los estados" allowClear
              value={filterStatus} onChange={v => setFilterStatus(v)}
              options={[
                { value: 'PAID',     label: 'Pagados' },
                { value: 'PENDING',  label: 'Pendientes' },
                { value: 'REFUNDED', label: 'Reembolsados' },
              ]}
            />
          </Col>
          {filtered.length > 0 && filterStatus === 'PAID' && (
            <Col>
              <Tooltip title="Total filtrado">
                <Tag color="success" style={{ lineHeight: '32px', padding: '0 12px' }}>
                  Total: {formatMoney(filtered.reduce((s, p) => s + p.amount, 0))}
                </Tag>
              </Tooltip>
            </Col>
          )}
        </Row>

        <Table
          dataSource={filtered} columns={columns} rowKey="id" size="small" scroll={{ x: 800 }}
          pagination={{
            pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'],
            showTotal: (t, range) => `${range[0]}–${range[1]} de ${t} pagos`,
          }}
          locale={{ emptyText: (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
              <div style={{ marginTop: 8, color: '#8c8c8c' }}>Sin registros de pago.</div>
            </div>
          ) }}
        />
      </Card>

      {/* ── Modal Registrar pago ── */}
      <Modal open={open} onCancel={() => setOpen(false)} title="Registrar pago" footer={null} destroyOnHidden>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
          <FormField label="Cita *">
            <Select style={{ width: '100%' }} placeholder="Seleccionar cita pendiente"
              value={apptId || undefined} onChange={onApptSelect} showSearch
              filterOption={(input, opt) =>
                (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={unpaid.map(a => ({
                value: String(a.id),
                label: `${a.client.fullName} — ${a.service.name} (${new Date(a.startTime).toLocaleDateString('es-SV')})`,
              }))}
            />
          </FormField>
          <Row gutter={12}>
            <Col span={12}>
              <FormField label="Monto ($) *">
                <Input type="number" step="0.01" min="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)} placeholder="10.00" />
              </FormField>
            </Col>
            <Col span={12}>
              <FormField label="Método *">
                <Select style={{ width: '100%' }} value={method} onChange={v => setMethod(v)}
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
          <FormField label="Notas">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones opcionales" />
          </FormField>
          {error && <p style={{ color: '#ff4d4f', fontSize: 13, margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="primary" loading={loading} disabled={!apptId} onClick={handleSubmit}>
            {loading ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

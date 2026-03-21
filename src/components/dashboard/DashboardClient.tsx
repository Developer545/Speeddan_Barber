'use client';

// ══════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL — KPIs + gráfica ventas POS + accesos rápidos
// ══════════════════════════════════════════════════════════

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';
import { Row, Col, Card, Statistic, Button, Typography, Tag, Space } from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, DollarOutlined,
  TeamOutlined, ScissorOutlined, UserOutlined, CreditCardOutlined,
  RightOutlined, ShoppingCartOutlined, LineChartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

// ── Tipos ───────────────────────────────────────────────
type WeekDay  = { day: string; count: number };
type VentaDay = { day: string; total: number; count: number };

type Stats = {
  citasHoy:        number;
  citasPendientes: number;
  ingresosHoy:     number;
  clientesActivos: number;
  citasSemana:     WeekDay[];
  // POS
  ventasPosHoy:   number;
  ingresosPosHoy: number;
  ventasSemana:   VentaDay[];
  ticketPromedio: number;
};

// ── Links rápidos ───────────────────────────────────────
const QUICK_LINKS = [
  { href: '/appointments', label: 'Ver citas de hoy',    icon: <CalendarOutlined />,   accent: '#0d9488' },
  { href: '/pos',          label: 'Ir al POS',           icon: <ShoppingCartOutlined />, accent: '#10b981' },
  { href: '/services',     label: 'Gestionar servicios', icon: <ScissorOutlined />,    accent: '#7c3aed' },
  { href: '/barbers',      label: 'Ver barberos',        icon: <UserOutlined />,       accent: '#0284c7' },
  { href: '/billing',      label: 'Registrar pago',      icon: <CreditCardOutlined />, accent: '#b45309' },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER:  'Propietario',
  BARBER: 'Barbero',
  CLIENT: 'Cliente',
};

// ── Tooltip personalizado para la gráfica ───────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e8e8e8',
      borderRadius: 8, padding: '8px 14px', fontSize: 12, boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#0d9488' }}>${payload[0].value.toFixed(2)}</div>
    </div>
  );
}

// ── Componente ──────────────────────────────────────────
export default function DashboardClient({
  stats,
  userName,
  userRole,
  tenantSlug,
}: {
  stats:      Stats;
  userName:   string;
  userRole:   string;
  tenantSlug: string;
}) {
  return (
    <>
      {/* ── Bienvenida ── */}
      <div style={{
        marginBottom:   24,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            12,
      }}>
        <div>
          <Title level={4} style={{ margin: '0 0 4px' }}>
            Bienvenido, {userName.split(' ')[0]}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Panel de gestión — {tenantSlug}
          </Text>
        </div>
        <Tag
          color="cyan"
          style={{ fontWeight: 600, fontSize: 12, padding: '4px 14px', borderRadius: 20 }}
        >
          {ROLE_LABELS[userRole] ?? userRole}
        </Tag>
      </div>

      {/* ── KPIs principales — fila 1 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Ingresos totales hoy */}
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic
              title="Ingresos hoy"
              value={stats.ingresosHoy}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
              suffix={<span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>USD</span>}
            />
          </Card>
        </Col>

        {/* Ventas POS hoy (count) */}
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #0d9488' }}>
            <Statistic
              title="Ventas POS hoy"
              value={stats.ventasPosHoy}
              prefix={<ShoppingCartOutlined style={{ color: '#0d9488' }} />}
              valueStyle={{ fontSize: 20 }}
              suffix={<span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>ventas</span>}
            />
          </Card>
        </Col>

        {/* Ticket promedio */}
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #7c3aed' }}>
            <Statistic
              title="Ticket promedio"
              value={stats.ticketPromedio}
              precision={2}
              prefix={<LineChartOutlined style={{ color: '#7c3aed' }} />}
              valueStyle={{ color: '#7c3aed', fontSize: 20 }}
              suffix={<span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>7 días</span>}
            />
          </Card>
        </Col>

        {/* Clientes activos */}
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #722ed1' }}>
            <Statistic
              title="Clientes activos"
              value={stats.clientesActivos}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ fontSize: 20 }}
              suffix={<span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>30 días</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* ── KPIs secundarios — fila 2 (citas) ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #0891b2' }}>
            <Statistic
              title="Citas hoy"
              value={stats.citasHoy}
              prefix={<CalendarOutlined style={{ color: '#0891b2' }} />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #f59e0b' }}>
            <Statistic
              title="Citas pendientes"
              value={stats.citasPendientes}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small" style={{ borderTop: '3px solid #10b981' }}>
            <Statistic
              title="Ingresos POS hoy"
              value={stats.ingresosPosHoy}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={0} sm={0} md={6}>
          {/* Espacio visual en desktop */}
          <div />
        </Col>
      </Row>

      {/* ── Gráfica + Accesos rápidos ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Title level={5} style={{ margin: 0 }}>Ventas POS — últimos 7 días</Title>
                <Tag color="green" style={{ fontSize: 11 }}>En vivo</Tag>
              </div>
            }
            size="small"
          >
            {stats.ventasSemana && stats.ventasSemana.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={stats.ventasSemana}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <ReTooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdf9' }} />
                  <Bar
                    dataKey="total"
                    name="Ventas $"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{
                height: 230, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: '#bfbfbf',
              }}>
                <ShoppingCartOutlined style={{ fontSize: 40, marginBottom: 12 }} />
                <Text type="secondary">Sin ventas POS registradas esta semana</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Accesos rápidos</Title>}
            size="small"
            style={{ height: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {QUICK_LINKS.map(link => (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <Button
                    block
                    icon={link.icon}
                    style={{
                      textAlign:   'left',
                      borderLeft:  `4px solid ${link.accent}`,
                      paddingLeft: 12,
                      height:      40,
                      fontWeight:  500,
                      display:     'flex',
                      alignItems:  'center',
                      gap:         8,
                    }}
                  >
                    <span style={{ flex: 1 }}>{link.label}</span>
                    <RightOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />
                  </Button>
                </Link>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </>
  );
}

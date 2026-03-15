'use client';

// ══════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL — KPIs + gráfica semanal + accesos rápidos
// ══════════════════════════════════════════════════════════

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';
import { Row, Col, Card, Statistic, Button, Typography, Tag, Space } from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, DollarOutlined,
  TeamOutlined, ScissorOutlined, UserOutlined, CreditCardOutlined,
  RightOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

// ── Tipos ───────────────────────────────────────────────
type WeekDay = { day: string; count: number };
type Stats = {
  citasHoy:        number;
  citasPendientes: number;
  ingresosHoy:     number;
  clientesActivos: number;
  citasSemana:     WeekDay[];
};

// ── Links rápidos ───────────────────────────────────────
const QUICK_LINKS = [
  { href: '/appointments', label: 'Ver citas de hoy',    icon: <CalendarOutlined />,  accent: '#0d9488' },
  { href: '/services',     label: 'Gestionar servicios', icon: <ScissorOutlined />,   accent: '#7c3aed' },
  { href: '/barbers',      label: 'Ver barberos',        icon: <UserOutlined />,      accent: '#0284c7' },
  { href: '/billing',      label: 'Registrar pago',      icon: <CreditCardOutlined />, accent: '#b45309' },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER:  'Propietario',
  BARBER: 'Barbero',
  CLIENT: 'Cliente',
};

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
        marginBottom:    24,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        flexWrap:        'wrap',
        gap:             12,
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

      {/* ── KPIs ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Citas hoy"
              value={stats.citasHoy}
              prefix={<CalendarOutlined style={{ color: '#0d9488' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Pendientes"
              value={stats.citasPendientes}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Ingresos hoy"
              value={stats.ingresosHoy}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Clientes activos"
              value={stats.clientesActivos}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Gráfica + Accesos rápidos ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Citas — últimos 7 días</Title>}
            size="small"
          >
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={stats.citasSemana}
                margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
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
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <ReTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }}
                  formatter={(v) => [v, 'Citas']}
                  cursor={{ fill: '#f0fdf9' }}
                />
                <Bar
                  dataKey="count"
                  name="Citas"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
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
                      textAlign:    'left',
                      borderLeft:   `4px solid ${link.accent}`,
                      paddingLeft:  12,
                      height:       40,
                      fontWeight:   500,
                      display:      'flex',
                      alignItems:   'center',
                      gap:          8,
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

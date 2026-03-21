'use client';

import React, { useState, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Table, Button, Modal, Drawer,
  Tabs, Tag, DatePicker, InputNumber, Form, Select, Switch,
  Tooltip, Space, Typography, Divider, Alert,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined,
  DeleteOutlined, SettingOutlined, UserOutlined,
  TeamOutlined, CalendarOutlined,
  EditOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { toast } from 'sonner';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// ── Tipos ─────────────────────────────────────────────
interface DetallePlanilla {
  id: number;
  barberoId: number;
  nombre: string;
  tipoPago: string;
  unidades: number;
  salarioBruto: number;
  isss: number;
  afp: number;
  renta: number;
  otrasDeducciones: number;
  totalDeducciones: number;
  salarioNeto: number;
  isssPatronal: number;
  afpPatronal: number;
  insaforp: number;
}

interface Planilla {
  id: number;
  periodo: string;
  estado: string;
  totalBruto: number;
  totalISS: number;
  totalAFP: number;
  totalRenta: number;
  totalDeducciones: number;
  totalNeto: number;
  totalPatronalISS: number;
  totalPatronalAFP: number;
  totalINSAFORP: number;
  /** In list view detalles may only contain { id } for count purposes */
  detalles: Array<Partial<DetallePlanilla> & { id: number }>;
  createdAt?: string;
}

interface BarberoResumen {
  id: number;
  nombre: string;
  tipoPago: string | null;
  salarioBase: number;
  valorPorUnidad: number;
  porcentajeServicio: number;
  aplicaRenta: boolean;
  configurado: boolean;
}

interface ConfigItem {
  id: number;
  clave: string;
  valor: number;
  descripcion: string | null;
  topeMaximo: number | null;
}

interface Props {
  planillasInit: Planilla[];
  barberosInit: BarberoResumen[];
  configInit: ConfigItem[];
  barberosConfigInit: unknown[];
  hasConfig: boolean;
}

const TIPO_PAGO_LABELS: Record<string, string> = {
  FIJO:         'Salario Fijo Mensual',
  POR_DIA:      'Por Día Trabajado',
  POR_SEMANA:   'Por Semana',
  POR_HORA:     'Por Hora',
  POR_SERVICIO: 'Por Servicio',
};

const TIPO_PAGO_UNIDAD: Record<string, string> = {
  FIJO:         '',
  POR_DIA:      'días',
  POR_SEMANA:   'semanas',
  POR_HORA:     'horas',
  POR_SERVICIO: 'servicios/ingresos',
};

const ESTADO_COLOR: Record<string, string> = {
  BORRADOR: 'default',
  APROBADA: 'success',
  PAGADA:   'processing',
};

function fmt(n: number) { return `$${n.toFixed(2)}`; }

export default function PlanillaClient({
  planillasInit,
  barberosInit,
  configInit,
  hasConfig,
}: Props) {
  const [planillas, setPlanillas] = useState<Planilla[]>(planillasInit);
  const [barberos]                = useState<BarberoResumen[]>(barberosInit);
  const [config, setConfig]       = useState<ConfigItem[]>(configInit);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('planillas');

  // Modales
  const [modalNueva, setModalNueva]               = useState(false);
  const [drawerDetalle, setDrawerDetalle]         = useState<Planilla | null>(null);
  const [drawerLoading, setDrawerLoading]         = useState(false);
  const [modalConfig, setModalConfig]             = useState<BarberoResumen | null>(null);

  // Formulario nueva planilla
  const [periodo, setPeriodo]     = useState<string>('');
  const [inputs, setInputs]       = useState<Record<number, number>>({});
  const [generating, setGenerating] = useState(false);

  // Formulario config barbero
  const [formConfig, setFormConfig] = useState<{
    tipoPago: string;
    salarioBase: number;
    valorPorUnidad: number;
    porcentajeServicio: number;
    aplicaRenta: boolean;
  }>({
    tipoPago: 'FIJO', salarioBase: 0, valorPorUnidad: 0, porcentajeServicio: 0, aplicaRenta: true,
  });

  // ── Fetch helpers ──────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/planilla');
      if (r.ok) setPlanillas(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Generar planilla ───────────────────────────────
  const handleGenerar = async () => {
    if (!periodo) { toast.error('Selecciona el período'); return; }
    const barberosConConfig = barberos.filter(b => b.configurado);
    if (!barberosConConfig.length) {
      toast.error('Configura el tipo de pago de al menos un barbero');
      return;
    }

    const barberoInputs = barberosConConfig.map(b => ({
      barberoId: b.id,
      unidades:  b.tipoPago === 'FIJO' ? 0 : (inputs[b.id] ?? 0),
    }));

    setGenerating(true);
    try {
      const r = await fetch('/api/planilla', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ periodo, barberos: barberoInputs }),
      });
      const data = await r.json();
      if (!r.ok) { toast.error(data.error || 'Error al generar planilla'); return; }
      toast.success(`Planilla ${periodo} generada`);
      setModalNueva(false);
      setPeriodo('');
      setInputs({});
      await reload();
    } finally {
      setGenerating(false);
    }
  };

  // ── Aprobar ────────────────────────────────────────
  const handleAprobar = (id: number) => {
    Modal.confirm({
      title:      '¿Aprobar planilla?',
      content:    'Una vez aprobada no podrá ser eliminada ni modificada.',
      okText:     'Aprobar',
      cancelText: 'Cancelar',
      okType:     'primary',
      onOk: async () => {
        const r = await fetch(`/api/planilla/${id}/aprobar`, { method: 'PATCH' });
        if (r.ok) { toast.success('Planilla aprobada'); await reload(); }
        else toast.error('Error al aprobar');
      },
    });
  };

  // ── Eliminar ───────────────────────────────────────
  const handleEliminar = (id: number) => {
    Modal.confirm({
      title:      '¿Eliminar planilla?',
      okText:     'Eliminar',
      okType:     'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        const r = await fetch(`/api/planilla/${id}`, { method: 'DELETE' });
        const d = await r.json();
        if (r.ok) { toast.success('Planilla eliminada'); await reload(); }
        else toast.error(d.error || 'Error al eliminar');
      },
    });
  };

  // ── Guardar config barbero ─────────────────────────
  const handleSaveConfigBarbero = async () => {
    if (!modalConfig) return;
    const r = await fetch('/api/planilla/barberos-config', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ barberoId: modalConfig.id, ...formConfig }),
    });
    if (r.ok) {
      toast.success('Configuración guardada');
      setModalConfig(null);
    } else {
      toast.error('Error al guardar');
    }
  };

  // ── Guardar config planilla ────────────────────────
  const handleSaveConfig = async () => {
    const r = await fetch('/api/planilla/config', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(config),
    });
    if (r.ok) toast.success('Parámetros guardados');
    else toast.error('Error al guardar');
  };

  const handleSeedConfig = async () => {
    const r = await fetch('/api/planilla/config', { method: 'POST' });
    if (r.ok) {
      toast.success('Parámetros inicializados');
      const updated = await fetch('/api/planilla/config');
      if (updated.ok) setConfig(await updated.json());
    }
  };

  // ── KPIs ───────────────────────────────────────────
  const configurados   = barberos.filter(b => b.configurado).length;
  const ultimaPlanilla = planillas[0];
  const totalNeto      = ultimaPlanilla?.totalNeto ?? 0;
  const totalPatronal  = ultimaPlanilla
    ? (ultimaPlanilla.totalPatronalISS + ultimaPlanilla.totalPatronalAFP + ultimaPlanilla.totalINSAFORP)
    : 0;

  // ── Columnas tabla planillas ───────────────────────
  const cols = [
    {
      title:     'Período',
      dataIndex: 'periodo',
      render:    (v: string) => <Text strong>{v}</Text>,
    },
    {
      title:     'Estado',
      dataIndex: 'estado',
      render:    (v: string) => <Tag color={ESTADO_COLOR[v] || 'default'}>{v}</Tag>,
    },
    {
      title:     'Barberos',
      dataIndex: 'detalles',
      align:     'center' as const,
      render:    (d: DetallePlanilla[]) => d.length,
    },
    {
      title:     'Salario Bruto',
      dataIndex: 'totalBruto',
      render:    (v: number) => <Text>{fmt(v)}</Text>,
    },
    {
      title:     'Deducciones',
      dataIndex: 'totalDeducciones',
      render:    (v: number) => <Text type="danger">{fmt(v)}</Text>,
    },
    {
      title:     'Salario Neto',
      dataIndex: 'totalNeto',
      render:    (v: number) => <Text strong style={{ color: '#0d9488' }}>{fmt(v)}</Text>,
    },
    {
      title:  'Costo Patronal',
      render: (r: Planilla) => (
        <Text type="secondary">{fmt(r.totalPatronalISS + r.totalPatronalAFP + r.totalINSAFORP)}</Text>
      ),
    },
    {
      title:  'Acciones',
      render: (r: Planilla) => (
        <Space>
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={async () => {
                setDrawerLoading(true);
                setDrawerDetalle(r);
                try {
                  const res = await fetch(`/api/planilla/${r.id}`);
                  if (res.ok) setDrawerDetalle(await res.json());
                } finally {
                  setDrawerLoading(false);
                }
              }}
            />
          </Tooltip>
          {r.estado === 'BORRADOR' && (
            <>
              <Tooltip title="Aprobar planilla">
                <Button size="small" icon={<CheckCircleOutlined />} type="primary"
                  onClick={() => handleAprobar(r.id)} />
              </Tooltip>
              <Tooltip title="Eliminar planilla">
                <Button size="small" icon={<DeleteOutlined />} danger
                  onClick={() => handleEliminar(r.id)} />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ── Columnas tabla detalle ─────────────────────────
  const colsDetalle = [
    { title: 'Barbero',    dataIndex: 'nombre',          render: (v: string) => <Text strong>{v}</Text> },
    { title: 'Tipo',       dataIndex: 'tipoPago',        render: (v: string) => <Tag>{TIPO_PAGO_LABELS[v] || v}</Tag> },
    { title: 'Bruto',      dataIndex: 'salarioBruto',    render: (v: number) => fmt(v) },
    { title: 'ISSS',       dataIndex: 'isss',            render: (v: number) => <Text type="danger">{fmt(v)}</Text> },
    { title: 'AFP',        dataIndex: 'afp',             render: (v: number) => <Text type="danger">{fmt(v)}</Text> },
    { title: 'Renta',      dataIndex: 'renta',           render: (v: number) => <Text type="danger">{fmt(v)}</Text> },
    { title: 'Total Ded.', dataIndex: 'totalDeducciones', render: (v: number) => <Text type="danger">{fmt(v)}</Text> },
    { title: 'Neto',       dataIndex: 'salarioNeto',     render: (v: number) => <Text strong style={{ color: '#0d9488' }}>{fmt(v)}</Text> },
    { title: 'ISSS Pat.',  dataIndex: 'isssPatronal',    render: (v: number) => <Text type="secondary">{fmt(v)}</Text> },
    { title: 'AFP Pat.',   dataIndex: 'afpPatronal',     render: (v: number) => <Text type="secondary">{fmt(v)}</Text> },
    { title: 'INSAFORP',   dataIndex: 'insaforp',        render: (v: number) => <Text type="secondary">{fmt(v)}</Text> },
  ];

  // ── Columnas tabla barberos (configuración) ────────
  const colsBarberos = [
    { title: 'Barbero', key: 'nombre', render: (r: BarberoResumen) => r.nombre },
    {
      title:  'Tipo de Pago',
      render: (r: BarberoResumen) => r.configurado
        ? <Tag color="cyan">{TIPO_PAGO_LABELS[r.tipoPago!] || r.tipoPago}</Tag>
        : <Tag color="orange">Sin configurar</Tag>,
    },
    {
      title:  'Salario/Valor',
      render: (r: BarberoResumen) => {
        if (!r.configurado) return '—';
        if (r.tipoPago === 'FIJO') return fmt(r.salarioBase);
        if (r.tipoPago === 'POR_SERVICIO' && r.porcentajeServicio > 0)
          return `${r.porcentajeServicio}% del servicio`;
        return `${fmt(r.valorPorUnidad)} por ${TIPO_PAGO_UNIDAD[r.tipoPago!] || 'unidad'}`;
      },
    },
    { title: 'Renta', render: (r: BarberoResumen) => r.configurado ? (r.aplicaRenta ? 'Sí' : 'No') : '—' },
    {
      title:  'Acciones',
      render: (r: BarberoResumen) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setFormConfig({
              tipoPago:           r.tipoPago || 'FIJO',
              salarioBase:        r.salarioBase || 0,
              valorPorUnidad:     r.valorPorUnidad || 0,
              porcentajeServicio: r.porcentajeServicio || 0,
              aplicaRenta:        r.aplicaRenta ?? true,
            });
            setModalConfig(r);
          }}
        >
          {r.configurado ? 'Editar' : 'Configurar'}
        </Button>
      ),
    },
  ];

  // ── Suppress unused dayjs warning — used for DatePicker ──
  void dayjs;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0d9488' }}>Planilla</Title>
          <Text type="secondary">Gestión de salarios y deducciones de barberos</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalNueva(true)}
            style={{ background: '#0d9488', borderColor: '#0d9488' }}
          >
            Nueva Planilla
          </Button>
        </Space>
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Barberos Configurados"
              value={configurados}
              suffix={`/ ${barberos.length}`}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#0d9488' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Último Período"
              value={ultimaPlanilla?.periodo ?? '—'}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Neto (Último Mes)"
              value={totalNeto}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#0d9488' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Costo Patronal (Último)"
              value={totalPatronal}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerta sin config */}
      {!hasConfig && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Configura los parámetros de planilla antes de generar"
          description="Ve a la pestaña Configuración → Parámetros y haz clic en 'Inicializar Parámetros' para cargar los valores por defecto."
          action={
            <Button size="small" onClick={() => setActiveTab('config')}>
              Ir a Configuración
            </Button>
          }
        />
      )}

      {/* Tabs principales */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key:   'planillas',
              label: <span><CalendarOutlined /> Planillas</span>,
              children: (
                <Table
                  dataSource={planillas}
                  columns={cols}
                  rowKey="id"
                  loading={loading}
                  size="middle"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'No hay planillas generadas' }}
                />
              ),
            },
            {
              key:   'config',
              label: <span><SettingOutlined /> Configuración</span>,
              children: (
                <Tabs
                  items={[
                    {
                      key:   'parametros',
                      label: 'Parámetros de Ley',
                      children: (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text type="secondary">
                              Tasas y tramos ISR según legislación El Salvador (editables)
                            </Text>
                            <Space>
                              <Button onClick={handleSeedConfig} icon={<ReloadOutlined />}>
                                Inicializar Parámetros
                              </Button>
                              <Button
                                type="primary"
                                onClick={handleSaveConfig}
                                style={{ background: '#0d9488', borderColor: '#0d9488' }}
                              >
                                Guardar Cambios
                              </Button>
                            </Space>
                          </div>
                          <Table
                            dataSource={config}
                            rowKey="clave"
                            size="small"
                            pagination={false}
                            columns={[
                              { title: 'Parámetro', dataIndex: 'clave', width: 220 },
                              { title: 'Descripción', dataIndex: 'descripcion' },
                              {
                                title:     'Valor',
                                dataIndex: 'valor',
                                width:     140,
                                render:    (v: number, row: ConfigItem) => (
                                  <InputNumber
                                    value={v}
                                    precision={4}
                                    step={0.01}
                                    size="small"
                                    onChange={val => setConfig(prev => prev.map(c =>
                                      c.clave === row.clave ? { ...c, valor: val ?? 0 } : c
                                    ))}
                                  />
                                ),
                              },
                            ]}
                          />
                        </div>
                      ),
                    },
                    {
                      key:   'barberos',
                      label: 'Tipo de Pago por Barbero',
                      children: (
                        <Table
                          dataSource={barberos}
                          rowKey="id"
                          size="middle"
                          pagination={false}
                          columns={colsBarberos}
                          locale={{ emptyText: 'No hay barberos activos' }}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* ── Modal: Nueva Planilla ──────────────────── */}
      <Modal
        open={modalNueva}
        title={<span><CalendarOutlined /> Generar Nueva Planilla</span>}
        onCancel={() => { setModalNueva(false); setPeriodo(''); setInputs({}); }}
        onOk={handleGenerar}
        okText="Generar Planilla"
        confirmLoading={generating}
        okButtonProps={{ style: { background: '#0d9488', borderColor: '#0d9488' } }}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Período:</Text>
          <div style={{ marginTop: 8 }}>
            <DatePicker
              picker="month"
              format="YYYY-MM"
              placeholder="Selecciona mes y año"
              onChange={d => setPeriodo(d ? d.format('YYYY-MM') : '')}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <Divider>Barberos y Unidades Trabajadas</Divider>

        {barberos.length === 0 ? (
          <Alert type="warning" message="No hay barberos activos" />
        ) : (
          <Table
            dataSource={barberos.filter(b => b.configurado)}
            rowKey="id"
            size="small"
            pagination={false}
            locale={{
              emptyText: 'Ningún barbero tiene tipo de pago configurado. Ve a Configuración → Barberos.',
            }}
            columns={[
              { title: 'Barbero',   dataIndex: 'nombre' },
              {
                title:  'Tipo Pago',
                dataIndex: 'tipoPago',
                render: (v: string) => <Tag>{TIPO_PAGO_LABELS[v] || v}</Tag>,
              },
              {
                title:  'Base / Unidades',
                render: (r: BarberoResumen) => {
                  if (r.tipoPago === 'FIJO') {
                    return <Text type="secondary">Fijo: {fmt(r.salarioBase)}</Text>;
                  }
                  return (
                    <InputNumber
                      placeholder={`N° ${TIPO_PAGO_UNIDAD[r.tipoPago!] || 'unidades'}`}
                      min={0}
                      precision={2}
                      style={{ width: 160 }}
                      value={inputs[r.id]}
                      onChange={v => setInputs(prev => ({ ...prev, [r.id]: v ?? 0 }))}
                    />
                  );
                },
              },
              {
                title:  'Bruto Est.',
                render: (r: BarberoResumen) => {
                  let bruto = 0;
                  if (r.tipoPago === 'FIJO') bruto = r.salarioBase;
                  else if (r.tipoPago === 'POR_SERVICIO' && r.porcentajeServicio > 0)
                    bruto = (inputs[r.id] ?? 0) * (r.porcentajeServicio / 100);
                  else bruto = r.valorPorUnidad * (inputs[r.id] ?? 0);
                  return <Text strong style={{ color: '#0d9488' }}>{fmt(bruto)}</Text>;
                },
              },
            ]}
          />
        )}

        {!hasConfig && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16 }}
            message="Los parámetros de planilla no están configurados. Ve a Configuración → Parámetros."
          />
        )}
      </Modal>

      {/* ── Drawer: Detalle planilla ───────────────── */}
      <Drawer
        open={!!drawerDetalle}
        onClose={() => setDrawerDetalle(null)}
        title={
          <span>
            Planilla — Período: <Text strong>{drawerDetalle?.periodo}</Text>
          </span>
        }
        width="90%"
        extra={
          <Tag color={ESTADO_COLOR[drawerDetalle?.estado || 'BORRADOR']}>
            {drawerDetalle?.estado}
          </Tag>
        }
      >
        {drawerDetalle && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              {[
                { label: 'Total Bruto',       value: drawerDetalle.totalBruto },
                { label: 'ISSS Empleados',    value: drawerDetalle.totalISS },
                { label: 'AFP Empleados',     value: drawerDetalle.totalAFP },
                { label: 'Renta (ISR)',        value: drawerDetalle.totalRenta },
                { label: 'Total Deducciones', value: drawerDetalle.totalDeducciones },
                { label: 'Total Neto',        value: drawerDetalle.totalNeto },
                { label: 'ISSS Patronal',     value: drawerDetalle.totalPatronalISS },
                { label: 'AFP Patronal',      value: drawerDetalle.totalPatronalAFP },
                { label: 'INSAFORP',          value: drawerDetalle.totalINSAFORP },
              ].map(item => (
                <Col key={item.label} xs={12} sm={8} md={6}>
                  <Statistic
                    title={item.label}
                    value={item.value}
                    prefix="$"
                    precision={2}
                    valueStyle={{
                      fontSize: 16,
                      color: item.label.includes('Neto') ? '#0d9488' : undefined,
                    }}
                  />
                </Col>
              ))}
            </Row>
            <Divider>Detalle por Barbero</Divider>
            <Table
              dataSource={drawerDetalle.detalles as DetallePlanilla[]}
              columns={colsDetalle}
              rowKey="id"
              size="small"
              scroll={{ x: true }}
              pagination={false}
              loading={drawerLoading}
            />
          </>
        )}
      </Drawer>

      {/* ── Modal: Config tipo de pago barbero ─────── */}
      <Modal
        open={!!modalConfig}
        title={<span><UserOutlined /> Configurar Pago — {modalConfig?.nombre}</span>}
        onCancel={() => setModalConfig(null)}
        onOk={handleSaveConfigBarbero}
        okText="Guardar"
        okButtonProps={{ style: { background: '#0d9488', borderColor: '#0d9488' } }}
        width={480}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tipo de Pago">
            <Select
              value={formConfig.tipoPago}
              onChange={v => setFormConfig(p => ({ ...p, tipoPago: v }))}
            >
              {Object.entries(TIPO_PAGO_LABELS).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>

          {formConfig.tipoPago === 'FIJO' && (
            <Form.Item label="Salario Mensual ($)">
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                prefix="$"
                value={formConfig.salarioBase}
                onChange={v => setFormConfig(p => ({ ...p, salarioBase: v ?? 0 }))}
              />
            </Form.Item>
          )}

          {['POR_DIA', 'POR_SEMANA', 'POR_HORA'].includes(formConfig.tipoPago) && (
            <Form.Item label={`Valor por ${TIPO_PAGO_UNIDAD[formConfig.tipoPago]} ($)`}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                prefix="$"
                value={formConfig.valorPorUnidad}
                onChange={v => setFormConfig(p => ({ ...p, valorPorUnidad: v ?? 0 }))}
              />
            </Form.Item>
          )}

          {formConfig.tipoPago === 'POR_SERVICIO' && (
            <>
              <Form.Item label="Valor por Servicio ($) — dejar en 0 si usa porcentaje">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix="$"
                  value={formConfig.valorPorUnidad}
                  onChange={v => setFormConfig(p => ({ ...p, valorPorUnidad: v ?? 0 }))}
                />
              </Form.Item>
              <Form.Item label="Porcentaje del servicio (%) — se aplica sobre ingresos totales del período">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={2}
                  value={formConfig.porcentajeServicio}
                  onChange={v => setFormConfig(p => ({ ...p, porcentajeServicio: v ?? 0 }))}
                />
              </Form.Item>
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="POR_SERVICIO: Ingresa las unidades en el modal de generación (puede ser: cantidad de servicios × valor, o ingresos totales × %)"
              />
            </>
          )}

          <Form.Item label="Aplica Retención de Renta (ISR)">
            <Switch
              checked={formConfig.aplicaRenta}
              onChange={v => setFormConfig(p => ({ ...p, aplicaRenta: v }))}
              checkedChildren="Sí"
              unCheckedChildren="No"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

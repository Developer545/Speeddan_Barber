'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Card, Row, Col, Statistic, Table, Button, Tag, Modal, Input,
  InputNumber, Select, Space, Drawer, Progress, Alert, Typography,
  Descriptions, Divider,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined, DeleteOutlined, EyeOutlined,
  GiftOutlined, TrophyOutlined, CreditCardOutlined,
  StarOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const { Text, Title } = Typography

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Tarjeta = {
  id: number
  codigo: string
  nombre: string
  tipo: 'SELLOS' | 'PUNTOS'
  meta: number
  dolarsPorPunto?: number
  saldoActual: number
  estado: 'ACTIVA' | 'PENDIENTE_CANJE'
  createdAt: string
  totalMovimientos: number
}

type Movimiento = {
  id: number
  tipo: string
  cantidad: number
  nota: string | null
  ventaId: number | null
  createdAt: string
}

type TarjetaDetalle = Tarjeta & { movimientos?: Movimiento[] }

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toFixed(2)}`

function TipoTag({ tipo }: { tipo: 'SELLOS' | 'PUNTOS' }) {
  return (
    <Tag color={tipo === 'SELLOS' ? 'blue' : 'gold'} style={{ fontWeight: 600 }}>
      {tipo === 'SELLOS' ? '🔖 Sellos' : '⭐ Puntos'}
    </Tag>
  )
}

function EstadoTag({ estado }: { estado: 'ACTIVA' | 'PENDIENTE_CANJE' }) {
  return estado === 'PENDIENTE_CANJE'
    ? <Tag color="error" icon={<GiftOutlined />}>Premio pendiente</Tag>
    : <Tag color="success">Activa</Tag>
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function LoyaltyClient({ initialTarjetas }: { initialTarjetas: Tarjeta[] }) {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>(initialTarjetas)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [detalle, setDetalle]         = useState<TarjetaDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [modalOpen, setModalOpen]     = useState(false)
  const [saving, setSaving]           = useState(false)

  // Form
  const [fCodigo,  setFCodigo]  = useState('')
  const [fNombre,  setFNombre]  = useState('')
  const [fTipo,    setFTipo]    = useState<'SELLOS' | 'PUNTOS'>('SELLOS')
  const [fMeta,    setFMeta]    = useState<number>(10)
  const [fDolares, setFDolares] = useState<number>(5)

  // ── KPIs ────────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    total:    tarjetas.length,
    pendiente: tarjetas.filter(t => t.estado === 'PENDIENTE_CANJE').length,
    sellos:   tarjetas.filter(t => t.tipo === 'SELLOS').length,
    puntos:   tarjetas.filter(t => t.tipo === 'PUNTOS').length,
  }), [tarjetas])

  // ── Abrir detalle ────────────────────────────────────────────────────────────

  const openDetalle = useCallback(async (t: Tarjeta) => {
    setDrawerOpen(true)
    setLoadingDetalle(true)
    try {
      const res  = await fetch(`/api/loyalty/tarjetas/${t.codigo}`)
      const json = await res.json()
      setDetalle({ ...t, movimientos: json.data?.movimientos ?? [] })
    } finally {
      setLoadingDetalle(false)
    }
  }, [])

  // ── Resetear manualmente ─────────────────────────────────────────────────────

  const resetearManual = async (t: Tarjeta) => {
    const confirm = window.confirm(`¿Resetear la tarjeta "${t.codigo}"? El saldo volverá a 0.`)
    if (!confirm) return
    const id = toast.loading('Reseteando tarjeta…')
    const res = await fetch(`/api/loyalty/tarjetas/${t.codigo}/canjear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nota: 'Reset manual por el administrador' }),
    })
    const json = await res.json()
    if (res.ok) {
      setTarjetas(prev => prev.map(x =>
        x.id === t.id ? { ...x, saldoActual: 0, estado: 'ACTIVA' } : x
      ))
      if (detalle?.id === t.id) setDetalle(d => d ? { ...d, saldoActual: 0, estado: 'ACTIVA' } : d)
      toast.success('Tarjeta reiniciada', { id })
    } else {
      toast.error(json.error?.message ?? 'Error', { id })
    }
  }

  // ── Crear tarjeta ────────────────────────────────────────────────────────────

  const openModal = () => {
    setFCodigo(''); setFNombre(''); setFTipo('SELLOS'); setFMeta(10); setFDolares(5)
    setModalOpen(true)
  }

  const handleCreate = async () => {
    if (!fCodigo.trim() || !fNombre.trim() || !fMeta) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/loyalty/tarjetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: fCodigo.trim().toUpperCase(),
          nombre: fNombre.trim(),
          tipo:   fTipo,
          meta:   fMeta,
          dolarsPorPunto: fTipo === 'PUNTOS' ? fDolares : undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error?.message ?? 'Error'); return }
      const nueva: Tarjeta = {
        id:            json.data.id,
        codigo:        json.data.codigo,
        nombre:        json.data.nombre,
        tipo:          json.data.tipo,
        meta:          json.data.meta,
        dolarsPorPunto: json.data.dolarsPorPunto ? Number(json.data.dolarsPorPunto) : undefined,
        saldoActual:   0,
        estado:        'ACTIVA',
        createdAt:     json.data.createdAt,
        totalMovimientos: 0,
      }
      setTarjetas(prev => [nueva, ...prev])
      setModalOpen(false)
      toast.success('Tarjeta creada')
    } finally { setSaving(false) }
  }

  // ── Eliminar tarjeta ─────────────────────────────────────────────────────────

  const handleDelete = async (t: Tarjeta) => {
    if (!window.confirm(`¿Eliminar la tarjeta "${t.codigo} — ${t.nombre}"?`)) return
    const id = toast.loading('Eliminando…')
    const res  = await fetch(`/api/loyalty/tarjetas/${t.codigo}`, { method: 'DELETE' })
    const json = await res.json()
    if (res.ok) {
      setTarjetas(prev => prev.filter(x => x.id !== t.id))
      toast.success('Tarjeta eliminada', { id })
    } else {
      toast.error(json.error?.message ?? 'Error', { id })
    }
  }

  // ── Columnas ─────────────────────────────────────────────────────────────────

  const columns: ColumnsType<Tarjeta> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      width: 110,
      render: v => <Text code style={{ fontWeight: 700, fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <TipoTag tipo={r.tipo} />
        </div>
      ),
    },
    {
      title: 'Progreso',
      key: 'progreso',
      width: 200,
      render: (_, r) => (
        <div>
          <Progress
            percent={Math.round((r.saldoActual / r.meta) * 100)}
            size="small"
            status={r.estado === 'PENDIENTE_CANJE' ? 'exception' : 'active'}
            format={() => `${r.saldoActual}/${r.meta}`}
          />
        </div>
      ),
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 150,
      render: (_, r) => <EstadoTag estado={r.estado} />,
    },
    {
      title: 'Usos',
      dataIndex: 'totalMovimientos',
      width: 70,
      align: 'center',
      render: v => <Text type="secondary">{v}</Text>,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetalle(r)} />
          <Button
            size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(r)}
            disabled={r.saldoActual > 0}
            title={r.saldoActual > 0 ? 'No se puede eliminar con saldo' : 'Eliminar'}
          />
        </Space>
      ),
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Alerta pendientes */}
      {kpis.pendiente > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<GiftOutlined />}
          message={`Hay ${kpis.pendiente} tarjeta${kpis.pendiente > 1 ? 's' : ''} con premio pendiente de canjear`}
          description="Cuando el cliente llegue al POS, ingresa su código de tarjeta y elige qué darle gratis."
          style={{ marginBottom: 16 }}
        />
      )}

      {/* KPIs */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Total tarjetas" value={kpis.total}
              prefix={<CreditCardOutlined style={{ color: 'hsl(var(--brand-primary))' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Premio pendiente" value={kpis.pendiente}
              valueStyle={{ color: kpis.pendiente > 0 ? '#ff4d4f' : undefined }}
              prefix={<GiftOutlined style={{ color: kpis.pendiente > 0 ? '#ff4d4f' : '#aaa' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Tarjetas de sellos" value={kpis.sellos}
              prefix={<StarOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Tarjetas de puntos" value={kpis.puntos}
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      {/* Tabla */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Puntos y Tarjetas de Fidelización</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
            Nueva tarjeta
          </Button>
        }
      >
        <Table
          dataSource={tarjetas}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 700 }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: (
            <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
              <CreditCardOutlined style={{ fontSize: 32 }} />
              <div style={{ marginTop: 8 }}>No hay tarjetas creadas aún.</div>
            </div>
          )}}
        />
      </Card>

      {/* Modal Crear */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title="Nueva tarjeta de fidelización"
        onOk={handleCreate}
        okText="Crear tarjeta"
        confirmLoading={saving}
        width={480}
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Código de tarjeta *</label>
            <Input
              placeholder="Ej: GOLD-001"
              value={fCodigo}
              onChange={e => setFCodigo(e.target.value.toUpperCase())}
              style={{ marginTop: 4 }}
            />
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              Debe ser único. Se imprime en la tarjeta física.
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Nombre descriptivo *</label>
            <Input
              placeholder="Ej: Tarjeta Cortes VIP"
              value={fNombre}
              onChange={e => setFNombre(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Tipo de tarjeta *</label>
            <Select
              value={fTipo}
              onChange={v => setFTipo(v)}
              style={{ width: '100%', marginTop: 4 }}
              options={[
                { value: 'SELLOS', label: '🔖 Sellos — 1 sello por cada factura' },
                { value: 'PUNTOS', label: '⭐ Puntos — acumula según monto gastado' },
              ]}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              {fTipo === 'SELLOS' ? 'Sellos necesarios para el premio *' : 'Puntos necesarios para el premio *'}
            </label>
            <InputNumber
              min={1} max={500}
              value={fMeta}
              onChange={v => setFMeta(v ?? 10)}
              style={{ width: '100%', marginTop: 4 }}
              addonAfter={fTipo === 'SELLOS' ? 'sellos' : 'puntos'}
            />
          </div>
          {fTipo === 'PUNTOS' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>¿Cuántos dólares equivalen a 1 punto? *</label>
              <InputNumber
                min={1} max={9999}
                value={fDolares}
                onChange={v => setFDolares(v ?? 5)}
                style={{ width: '100%', marginTop: 4 }}
                addonBefore="$"
                addonAfter="= 1 punto"
              />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Ej: Si pone $5, por cada $5 en factura el cliente gana 1 punto.
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Drawer Detalle */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={detalle ? `Tarjeta ${detalle.codigo}` : 'Detalle'}
        width={480}
        loading={loadingDetalle}
      >
        {detalle && (
          <>
            <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Nombre">{detalle.nombre}</Descriptions.Item>
              <Descriptions.Item label="Tipo"><TipoTag tipo={detalle.tipo} /></Descriptions.Item>
              <Descriptions.Item label="Estado"><EstadoTag estado={detalle.estado} /></Descriptions.Item>
              {detalle.tipo === 'PUNTOS' && detalle.dolarsPorPunto && (
                <Descriptions.Item label="Conversión">
                  {fmt(detalle.dolarsPorPunto)} = 1 punto
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Creada">
                {format(new Date(detalle.createdAt), 'dd MMM yyyy', { locale: es })}
              </Descriptions.Item>
            </Descriptions>

            {/* Barra de progreso */}
            <Card size="small" style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Progreso actual
              </div>
              <Progress
                type="circle"
                percent={Math.round((detalle.saldoActual / detalle.meta) * 100)}
                size={100}
                status={detalle.estado === 'PENDIENTE_CANJE' ? 'exception' : 'active'}
                format={() => `${detalle.saldoActual}/${detalle.meta}`}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                {detalle.tipo === 'SELLOS' ? 'sellos acumulados' : 'puntos acumulados'}
              </div>
            </Card>

            {detalle.estado === 'PENDIENTE_CANJE' && (
              <Alert
                type="warning"
                showIcon
                message="Premio pendiente de canje"
                description="Esta tarjeta está completa. En el POS, el cliente puede elegir su premio. Puedes resetearla manualmente si el canje ya fue entregado."
                style={{ marginBottom: 12 }}
                action={
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => resetearManual(detalle)}>
                    Resetear
                  </Button>
                }
              />
            )}

            <Divider>Historial de movimientos</Divider>

            {(detalle.movimientos ?? []).length === 0 ? (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 16 }}>
                Aún no hay movimientos en esta tarjeta.
              </Text>
            ) : (
              <Table
                dataSource={detalle.movimientos}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Fecha',
                    dataIndex: 'createdAt',
                    width: 110,
                    render: v => <Text style={{ fontSize: 11 }}>{format(new Date(v), 'dd/MM/yy HH:mm')}</Text>,
                  },
                  {
                    title: 'Tipo',
                    dataIndex: 'tipo',
                    width: 80,
                    render: v => (
                      <Tag color={v === 'ACUMULO' ? 'blue' : 'red'} style={{ fontSize: 10 }}>
                        {v === 'ACUMULO' ? '+' : '–'} {v}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Cant.',
                    dataIndex: 'cantidad',
                    width: 60,
                    align: 'center',
                    render: v => (
                      <Text style={{ fontWeight: 700, color: v > 0 ? '#52c41a' : '#ff4d4f' }}>
                        {v > 0 ? `+${v}` : v}
                      </Text>
                    ),
                  },
                  {
                    title: 'Nota',
                    dataIndex: 'nota',
                    render: v => <Text style={{ fontSize: 11 }} type="secondary">{v ?? '—'}</Text>,
                  },
                ]}
              />
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}

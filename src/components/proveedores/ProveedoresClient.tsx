'use client';

// ══════════════════════════════════════════════════════════
// PROVEEDORES — CRUD COMPLETO (patrón Speeddansys ERP)
// KPIs | Tabla Ant Design | Modal crear/editar | Drawer detalle | Soft delete
// ══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Table, Card, Button, Row, Col,
  Statistic, Tag, Select, Modal, Input,
  Typography, Tooltip, Popconfirm, Space,
  Drawer, Descriptions, Form, theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined,
  ShopOutlined, GlobalOutlined, CreditCardOutlined,
  PhoneOutlined, MailOutlined, UserOutlined,
  EnvironmentOutlined, IdcardOutlined,
  CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';
import { FormField } from '@/components/shared/FormField';
import { useBarberTheme } from '@/context/ThemeContext';

const { Title, Text } = Typography;

// ── Tipos ──────────────────────────────────────────────────────────────────

type Proveedor = {
  id:           number;
  tenantId:     number;
  nombre:       string;
  nit:          string | null;
  nrc:          string | null;
  correo:       string | null;
  telefono:     string | null;
  tipo:         string;
  contacto:     string | null;
  plazoCredito: number;
  direccion:    string | null;
  activo:       boolean;
  createdAt:    string;
  updatedAt:    string;
};

type FormValues = {
  nombre:       string;
  nit:          string;
  nrc:          string;
  correo:       string;
  telefono:     string;
  tipo:         string;
  contacto:     string;
  plazoCredito: number;
  direccion:    string;
};

const FORM_DEFAULTS: FormValues = {
  nombre:       '',
  nit:          '',
  nrc:          '',
  correo:       '',
  telefono:     '',
  tipo:         'NACIONAL',
  contacto:     '',
  plazoCredito: 0,
  direccion:    '',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ── Componente ─────────────────────────────────────────────────────────────

type ServerStats = {
  total:        number;
  conCredito:   number;
  totalCompras: number;
};

type Props = {
  initialProveedores: Proveedor[];
  initialStats:       ServerStats;
};

export default function ProveedoresClient({ initialProveedores }: Props) {
  const { theme: barberTheme } = useBarberTheme()
  const primary = barberTheme.colorPrimary
  const { token } = theme.useToken()
  const C = {
    bgPage:        'hsl(var(--bg-page))',
    bgSurface:     'hsl(var(--bg-surface))',
    bgSubtle:      'hsl(var(--bg-subtle))',
    bgMuted:       'hsl(var(--bg-muted))',
    bgPrimaryLow:  `${primary}18`,
    textPrimary:   'hsl(var(--text-primary))',
    textSecondary: 'hsl(var(--text-secondary))',
    textMuted:     'hsl(var(--text-muted))',
    textDisabled:  'hsl(var(--text-disabled))',
    border:        'hsl(var(--border-default))',
    borderStrong:  'hsl(var(--border-strong))',
    colorSuccess:  token.colorSuccess,
    colorError:    token.colorError,
    colorWarning:  token.colorWarning,
    colorInfo:     token.colorInfo,
  }

  const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);

  // Filtros
  const [search,     setSearch]     = useState('');
  const [filterTipo, setFilterTipo] = useState<string | undefined>(undefined);

  // Modal crear / editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Proveedor | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState('');
  const [form]                    = Form.useForm<FormValues>();

  // Drawer de detalle
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [detailRecord, setDetailRecord] = useState<Proveedor | null>(null);

  // ── Lista filtrada (client-side) ────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = proveedores;
    if (filterTipo) list = list.filter(p => p.tipo === filterTipo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.nit      ?? '').toLowerCase().includes(q) ||
        (p.nrc      ?? '').toLowerCase().includes(q) ||
        (p.contacto ?? '').toLowerCase().includes(q) ||
        (p.correo   ?? '').toLowerCase().includes(q) ||
        (p.telefono ?? '').includes(q),
      );
    }
    return list;
  }, [proveedores, search, filterTipo]);

  // ── Abrir modal crear ──────────────────────────────────────────────────

  function handleNuevo() {
    setEditing(null);
    form.setFieldsValue(FORM_DEFAULTS);
    setFormError('');
    setModalOpen(true);
  }

  // ── Abrir modal editar ─────────────────────────────────────────────────

  function handleEditar(p: Proveedor) {
    setEditing(p);
    form.setFieldsValue({
      nombre:       p.nombre,
      nit:          p.nit          ?? '',
      nrc:          p.nrc          ?? '',
      correo:       p.correo       ?? '',
      telefono:     p.telefono     ?? '',
      tipo:         p.tipo,
      contacto:     p.contacto     ?? '',
      plazoCredito: p.plazoCredito,
      direccion:    p.direccion    ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  // ── Abrir drawer de detalle ────────────────────────────────────────────

  function handleVerDetalle(p: Proveedor) {
    setDetailRecord(p);
    setDrawerOpen(true);
  }

  // ── Guardar (crear o editar) ───────────────────────────────────────────

  async function handleModalOk() {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // antd muestra los errores inline
    }

    setSaving(true);
    setFormError('');

    try {
      const body = {
        nombre:       values.nombre.trim(),
        nit:          values.nit?.trim()      || undefined,
        nrc:          values.nrc?.trim()      || undefined,
        correo:       values.correo?.trim()   || undefined,
        telefono:     values.telefono?.trim() || undefined,
        tipo:         values.tipo,
        contacto:     values.contacto?.trim() || undefined,
        plazoCredito: Number(values.plazoCredito) || 0,
        direccion:    values.direccion?.trim() || undefined,
      };

      const url    = editing ? `/api/proveedores/${editing.id}` : '/api/proveedores';
      const method = editing ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        const msg = json.error?.message ?? 'Error al guardar';
        setFormError(msg);
        toast.error(msg);
        return;
      }

      if (editing) {
        setProveedores(prev =>
          prev.map(p => p.id === editing.id ? { ...p, ...json.data } : p),
        );
        if (detailRecord?.id === editing.id) setDetailRecord({ ...detailRecord, ...json.data });
        toast.success(`"${values.nombre.trim()}" actualizado`);
      } else {
        setProveedores(prev => [json.data, ...prev]);
        toast.success(`Proveedor "${values.nombre.trim()}" creado`);
      }

      setModalOpen(false);
    } catch {
      setFormError('Error de red');
      toast.error('Error de red');
    } finally {
      setSaving(false);
    }
  }

  // ── Desactivar (soft delete) ───────────────────────────────────────────

  async function handleDesactivar(p: Proveedor) {
    const res = await fetch(`/api/proveedores/${p.id}`, { method: 'DELETE' });
    if (res.ok) {
      setProveedores(prev =>
        prev.map(x => x.id === p.id ? { ...x, activo: false } : x),
      );
      if (detailRecord?.id === p.id) {
        setDetailRecord(prev => prev ? { ...prev, activo: false } : prev);
      }
      toast.success(`"${p.nombre}" desactivado`);
    } else {
      toast.error('No se pudo desactivar el proveedor');
    }
  }

  // ── Toggle activo ──────────────────────────────────────────────────────

  async function toggleActivo(p: Proveedor) {
    const next = !p.activo;
    const res  = await fetch(`/api/proveedores/${p.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ activo: next }),
    });
    if (res.ok) {
      setProveedores(prev => prev.map(x => x.id === p.id ? { ...x, activo: next } : x));
      if (detailRecord?.id === p.id) {
        setDetailRecord(prev => prev ? { ...prev, activo: next } : prev);
      }
      toast.success(`${p.nombre} ${next ? 'activado' : 'desactivado'}`);
    } else {
      toast.error('No se pudo cambiar el estado');
    }
  }

  // ── Columnas de la tabla ───────────────────────────────────────────────

  const columns: ColumnsType<Proveedor> = [
    {
      title:  'Proveedor',
      key:    'nombre',
      render: (_, r) => (
        <Space size={10} style={{ opacity: r.activo ? 1 : 0.5 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: r.tipo === 'INTERNACIONAL' ? C.colorInfo : primary,
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>
            {getInitials(r.nombre)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: '18px' }}>{r.nombre}</div>
            {r.contacto && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                <UserOutlined style={{ marginRight: 3 }} />{r.contacto}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title:     'NIT',
      dataIndex: 'nit',
      key:       'nit',
      width:     130,
      render:    (v: string | null) => v
        ? <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title:  'Tipo',
      key:    'tipo',
      width:  130,
      render: (_, r) => (
        <Tag
          color={r.tipo === 'INTERNACIONAL' ? 'blue' : 'green'}
          icon={r.tipo === 'INTERNACIONAL' ? <GlobalOutlined /> : <ShopOutlined />}
        >
          {r.tipo === 'INTERNACIONAL' ? 'Internacional' : 'Nacional'}
        </Tag>
      ),
    },
    {
      title:  'Contacto',
      key:    'contacto',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          {r.telefono && (
            <div>
              <PhoneOutlined style={{ marginRight: 4, color: C.textMuted }} />
              {r.telefono}
            </div>
          )}
          {r.correo && (
            <div style={{ marginTop: 2 }}>
              <MailOutlined style={{ marginRight: 4, color: C.textMuted }} />
              {r.correo}
            </div>
          )}
          {!r.telefono && !r.correo && <Text type="secondary">—</Text>}
        </div>
      ),
    },
    {
      title:  'Plazo crédito',
      key:    'plazoCredito',
      width:  120,
      align:  'center',
      render: (_, r) => r.plazoCredito > 0
        ? (
          <Tag
            color="gold"
            icon={<CreditCardOutlined />}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {r.plazoCredito} días
          </Tag>
        )
        : <Tag color="default">Contado</Tag>,
    },
    {
      title:  'Estado',
      key:    'activo',
      width:  100,
      render: (_, r) => (
        <Tag
          color={r.activo ? 'success' : 'default'}
          style={{ cursor: 'pointer' }}
          icon={r.activo ? <CheckCircleOutlined /> : <StopOutlined />}
          onClick={() => toggleActivo(r)}
        >
          {r.activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title:  'Acciones',
      key:    'actions',
      width:  110,
      fixed:  'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleVerDetalle(record)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Desactivar este proveedor?"
            description="El proveedor quedará inactivo pero se conservarán sus datos."
            okText="Desactivar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={!record.activo}
            onConfirm={() => handleDesactivar(record)}
          >
            <Tooltip title={record.activo ? 'Desactivar' : 'Ya inactivo'}>
              <Button
                size="small"
                danger
                disabled={!record.activo}
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small" style={{ borderTop: `3px solid ${primary}` }}>
            <Statistic
              title="Total proveedores"
              value={proveedores.length}
              prefix={<ShopOutlined style={{ color: primary }} />}
              valueStyle={{ color: primary, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ borderTop: `3px solid ${C.colorSuccess}` }}>
            <Statistic
              title="Nacionales"
              value={proveedores.filter(p => p.tipo === 'NACIONAL').length}
              prefix={<ShopOutlined style={{ color: C.colorSuccess }} />}
              valueStyle={{ color: C.colorSuccess, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ borderTop: `3px solid ${C.colorInfo}` }}>
            <Statistic
              title="Internacionales"
              value={proveedores.filter(p => p.tipo === 'INTERNACIONAL').length}
              prefix={<GlobalOutlined style={{ color: C.colorInfo }} />}
              valueStyle={{ color: C.colorInfo, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small" style={{ borderTop: `3px solid ${C.colorWarning}` }}>
            <Statistic
              title="Con crédito"
              value={proveedores.filter(p => p.plazoCredito > 0).length}
              prefix={<CreditCardOutlined style={{ color: C.colorWarning }} />}
              valueStyle={{ color: C.colorWarning, fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Tabla principal ────────────────────────────────────────────── */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Proveedores</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo proveedor
          </Button>
        }
      >
        {/* Toolbar */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input.Search
              placeholder="Buscar por nombre, NIT, NRC, contacto..."
              allowClear
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Filtrar por tipo"
              allowClear
              style={{ width: '100%' }}
              value={filterTipo}
              onChange={v => setFilterTipo(v)}
              options={[
                { value: 'NACIONAL',       label: 'Nacional' },
                { value: 'INTERNACIONAL',  label: 'Internacional' },
              ]}
            />
          </Col>
          <Col>
            <Tooltip title="Limpiar filtros">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => { setSearch(''); setFilterTipo(undefined); }}
              />
            </Tooltip>
          </Col>
        </Row>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 820 }}
          onRow={r => ({
            onClick:    () => handleVerDetalle(r),
            style:      { cursor: 'pointer' },
          })}
          pagination={{
            pageSize:        10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal:       (t, range) => `${range[0]}–${range[1]} de ${t} proveedores`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <ShopOutlined style={{ fontSize: 32, color: C.textDisabled }} />
                <div style={{ marginTop: 8, color: C.textMuted }}>
                  {search || filterTipo
                    ? 'Sin resultados. Intenta con otro término.'
                    : 'No hay proveedores aún. Usa "+ Nuevo proveedor".'}
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Drawer: Detalle del proveedor ──────────────────────────────── */}
      <Drawer
        title="Detalle del proveedor"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        extra={
          <Space>
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => {
                setDrawerOpen(false);
                if (detailRecord) handleEditar(detailRecord);
              }}
            >
              Editar
            </Button>
          </Space>
        }
      >
        {detailRecord && (
          <>
            {/* Cabecera visual */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 64, height: 64, borderRadius: '50%',
                background: detailRecord.tipo === 'INTERNACIONAL' ? C.colorInfo : primary,
                fontSize: 24, fontWeight: 700, color: '#fff',
                marginBottom: 12,
              }}>
                {getInitials(detailRecord.nombre)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{detailRecord.nombre}</div>
              <div style={{ marginTop: 6 }}>
                <Tag
                  color={detailRecord.tipo === 'INTERNACIONAL' ? 'blue' : 'green'}
                  icon={detailRecord.tipo === 'INTERNACIONAL' ? <GlobalOutlined /> : <ShopOutlined />}
                >
                  {detailRecord.tipo === 'INTERNACIONAL' ? 'Internacional' : 'Nacional'}
                </Tag>
                <Tag color={detailRecord.activo ? 'success' : 'default'}>
                  {detailRecord.activo ? 'Activo' : 'Inactivo'}
                </Tag>
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              {detailRecord.nit && (
                <Descriptions.Item label={<><IdcardOutlined style={{ marginRight: 4 }} />NIT</>}>
                  <Text style={{ fontFamily: 'monospace' }}>{detailRecord.nit}</Text>
                </Descriptions.Item>
              )}
              {detailRecord.nrc && (
                <Descriptions.Item label="NRC">
                  <Text style={{ fontFamily: 'monospace' }}>{detailRecord.nrc}</Text>
                </Descriptions.Item>
              )}
              {detailRecord.contacto && (
                <Descriptions.Item label={<><UserOutlined style={{ marginRight: 4 }} />Contacto</>}>
                  {detailRecord.contacto}
                </Descriptions.Item>
              )}
              {detailRecord.telefono && (
                <Descriptions.Item label={<><PhoneOutlined style={{ marginRight: 4 }} />Teléfono</>}>
                  {detailRecord.telefono}
                </Descriptions.Item>
              )}
              {detailRecord.correo && (
                <Descriptions.Item label={<><MailOutlined style={{ marginRight: 4 }} />Correo</>}>
                  {detailRecord.correo}
                </Descriptions.Item>
              )}
              <Descriptions.Item label={<><CreditCardOutlined style={{ marginRight: 4 }} />Plazo crédito</>}>
                {detailRecord.plazoCredito > 0
                  ? <Tag color="gold">{detailRecord.plazoCredito} días</Tag>
                  : <Tag color="default">Contado</Tag>}
              </Descriptions.Item>
              {detailRecord.direccion && (
                <Descriptions.Item label={<><EnvironmentOutlined style={{ marginRight: 4 }} />Dirección</>}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{detailRecord.direccion}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Registrado">
                <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(detailRecord.createdAt)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Última modificación">
                <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(detailRecord.updatedAt)}</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Acción desactivar */}
            {detailRecord.activo && (
              <Popconfirm
                title="¿Desactivar este proveedor?"
                description="El proveedor quedará inactivo pero se conservarán sus datos."
                okText="Desactivar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                onConfirm={() => {
                  handleDesactivar(detailRecord);
                  setDrawerOpen(false);
                }}
              >
                <Button
                  danger
                  block
                  style={{ marginTop: 20 }}
                  icon={<StopOutlined />}
                >
                  Desactivar proveedor
                </Button>
              </Popconfirm>
            )}
          </>
        )}
      </Drawer>

      {/* ── Modal: Crear / Editar proveedor ────────────────────────────── */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalOk}
        confirmLoading={saving}
        okText={saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear proveedor'}
        cancelText="Cancelar"
        title={
          <Space>
            <ShopOutlined style={{ color: primary }} />
            <span>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</span>
          </Space>
        }
        destroyOnHidden
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={FORM_DEFAULTS}
          style={{ paddingTop: 8 }}
        >
          <Row gutter={16}>
            {/* Nombre */}
            <Col span={24}>
              <FormField label="Nombre del proveedor *">
                <Form.Item
                  name="nombre"
                  rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="Distribuidora XYZ" autoFocus />
                </Form.Item>
              </FormField>
            </Col>

            {/* NIT y NRC */}
            <Col xs={24} sm={12}>
              <FormField label="NIT">
                <Form.Item name="nit" style={{ marginBottom: 0 }}>
                  <Input placeholder="0614-000000-000-0" />
                </Form.Item>
              </FormField>
            </Col>
            <Col xs={24} sm={12}>
              <FormField label="NRC">
                <Form.Item name="nrc" style={{ marginBottom: 0 }}>
                  <Input placeholder="000000-0" />
                </Form.Item>
              </FormField>
            </Col>

            {/* Correo y Teléfono */}
            <Col xs={24} sm={12}>
              <FormField label="Correo electrónico">
                <Form.Item
                  name="correo"
                  rules={[{
                    type: 'email',
                    message: 'Ingresa un correo válido',
                    warningOnly: false,
                  }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    type="email"
                    prefix={<MailOutlined style={{ color: C.textMuted }} />}
                    placeholder="proveedor@ejemplo.com"
                  />
                </Form.Item>
              </FormField>
            </Col>
            <Col xs={24} sm={12}>
              <FormField label="Teléfono">
                <Form.Item name="telefono" style={{ marginBottom: 0 }}>
                  <Input
                    prefix={<PhoneOutlined style={{ color: C.textMuted }} />}
                    placeholder="+503 2000-0000"
                  />
                </Form.Item>
              </FormField>
            </Col>

            {/* Tipo y Plazo crédito */}
            <Col xs={24} sm={12}>
              <FormField label="Tipo de proveedor *">
                <Form.Item
                  name="tipo"
                  rules={[{ required: true, message: 'Selecciona el tipo' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    style={{ width: '100%' }}
                    options={[
                      { value: 'NACIONAL',      label: 'Nacional' },
                      { value: 'INTERNACIONAL', label: 'Internacional' },
                    ]}
                  />
                </Form.Item>
              </FormField>
            </Col>
            <Col xs={24} sm={12}>
              <FormField label="Plazo de crédito (días)">
                <Form.Item
                  name="plazoCredito"
                  rules={[{
                    validator: (_, value) =>
                      value === undefined || value === '' || Number(value) >= 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('Debe ser 0 o más días')),
                  }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    suffix="días"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </FormField>
            </Col>

            {/* Contacto */}
            <Col span={24}>
              <FormField label="Persona de contacto">
                <Form.Item name="contacto" style={{ marginBottom: 0 }}>
                  <Input
                    prefix={<UserOutlined style={{ color: C.textMuted }} />}
                    placeholder="Nombre del representante o vendedor"
                  />
                </Form.Item>
              </FormField>
            </Col>

            {/* Dirección */}
            <Col span={24}>
              <FormField label="Dirección">
                <Form.Item name="direccion" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    rows={2}
                    placeholder="Calle, colonia, municipio, departamento..."
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
              </FormField>
            </Col>
          </Row>
        </Form>

        {formError && (
          <p style={{ color: C.colorError, fontSize: 13, margin: '8px 0 0' }}>
            {formError}
          </p>
        )}
      </Modal>
    </>
  );
}

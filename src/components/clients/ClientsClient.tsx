'use client';

// ══════════════════════════════════════════════════════════
// CLIENTES — CRUD COMPLETO (patrón Speeddansys ERP)
// ══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Table, Card, Input, Button, Space, Row, Col,
  Statistic, Tag, Tooltip, Popconfirm, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined, PlusOutlined, ReloadOutlined,
  TeamOutlined, EditOutlined, DeleteOutlined,
  PhoneOutlined, CheckCircleOutlined, MailOutlined,
} from '@ant-design/icons';

// Componentes internos del formulario (react-hook-form)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button as SdButton }  from '@/components/ui/button';
import { Input as SdInput }    from '@/components/ui/input';
import { FormField }           from '@/components/shared/FormField';

const { Title, Text } = Typography;

// ── Tipos ──────────────────────────────────────────────────────────────────

type Client = {
  id: number; fullName: string; email: string; phone: string | null;
  active: boolean; createdAt: string; totalAppointments: number; lastVisit: string | null;
};
type FormValues = { fullName: string; email: string; phone: string };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  const { register, handleSubmit, reset } = useForm<FormValues>();

  // Filtro cliente-side
  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search),
  );

  // ── Abrir modal crear ──────────────────────────────────
  const handleNuevo = () => {
    setEditing(null);
    reset({ fullName: '', email: '', phone: '' });
    setError('');
    setOpen(true);
  };

  // ── Abrir modal editar ─────────────────────────────────
  const handleEditar = (c: Client) => {
    setEditing(c);
    reset({ fullName: c.fullName, email: c.email, phone: c.phone ?? '' });
    setError('');
    setOpen(true);
  };

  // ── Guardar (crear o editar) ───────────────────────────
  async function onSubmit(values: FormValues) {
    setSaving(true); setError('');
    try {
      const body = {
        fullName: values.fullName.trim(),
        email:    values.email.trim().toLowerCase(),
        phone:    values.phone.trim() || undefined,
      };
      const url = editing ? `/api/clients/${editing.id}` : '/api/clients';
      const res = await fetch(url, {
        method:  editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error?.message ?? 'Error al guardar';
        setError(msg); toast.error(msg); return;
      }
      if (editing) {
        setClients(prev => prev.map(c => c.id === editing.id ? { ...c, ...json.data } : c));
        toast.success(`"${values.fullName.trim()}" actualizado`);
      } else {
        setClients(prev => [{ ...json.data, totalAppointments: 0, lastVisit: null }, ...prev]);
        toast.success(`Cliente "${values.fullName.trim()}" creado`);
      }
      setOpen(false);
    } catch {
      setError('Error de red'); toast.error('Error de red');
    } finally { setSaving(false); }
  }

  // ── Eliminar (sin confirm — usa Popconfirm de antd) ────
  async function handleEliminar(c: Client) {
    const res = await fetch(`/api/clients/${c.id}`, { method: 'DELETE' });
    if (res.ok) {
      setClients(prev => prev.filter(x => x.id !== c.id));
      toast.success(`"${c.fullName}" eliminado`);
    } else {
      toast.error('No se pudo eliminar');
    }
  }

  // ── Activar / desactivar ───────────────────────────────
  async function toggleActive(c: Client) {
    const next = !c.active;
    const res  = await fetch(`/api/clients/${c.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ active: next }),
    });
    if (res.ok) {
      setClients(prev => prev.map(x => x.id === c.id ? { ...x, active: next } : x));
      toast.success(`${c.fullName} ${next ? 'activado' : 'desactivado'}`);
    } else { toast.error('No se pudo cambiar el estado'); }
  }

  // ── Columnas de la tabla (patrón Speeddansys) ──────────
  const columns: ColumnsType<Client> = [
    {
      title:  'Cliente',
      key:    'fullName',
      render: (_, r) => (
        <div style={{ opacity: r.active ? 1 : 0.5 }}>
          <div style={{ fontWeight: 500 }}>{r.fullName}</div>
          <Space size={4} style={{ marginTop: 2 }}>
            <MailOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
            <Text style={{ fontSize: 12 }} type="secondary">{r.email}</Text>
          </Space>
        </div>
      ),
    },
    {
      title:     'Teléfono',
      dataIndex: 'phone',
      key:       'phone',
      width:     140,
      render:    (v: string | null) => v ? (
        <Space size={4}>
          <PhoneOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
          <Text style={{ fontSize: 12 }}>{v}</Text>
        </Space>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title:     'Citas',
      dataIndex: 'totalAppointments',
      key:       'totalAppointments',
      width:     80,
      align:     'center',
      render:    (v: number) => (
        <Tag color={v > 0 ? 'blue' : 'default'}
          style={{ fontVariantNumeric: 'tabular-nums', fontWeight: v > 0 ? 600 : 400 }}>
          {v}
        </Tag>
      ),
    },
    {
      title:     'Última visita',
      dataIndex: 'lastVisit',
      key:       'lastVisit',
      width:     140,
      render:    (v: string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(v)}</Text>
      ),
    },
    {
      title:     'Estado',
      dataIndex: 'active',
      key:       'active',
      width:     100,
      render:    (v: boolean, r: Client) => (
        <Tag
          color={v ? 'success' : 'default'}
          style={{ cursor: 'pointer' }}
          onClick={() => toggleActive(r)}
        >
          {v ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title:  'Acciones',
      key:    'actions',
      width:  90,
      fixed:  'right',
      render: (_, record) => (
        <Space size={4}>
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
            title="¿Eliminar este cliente?"
            description="Si tiene citas asociadas se desactivará en su lugar."
            okText="Eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleEliminar(record)}
          >
            <Tooltip title="Eliminar">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── KPIs ───────────────────────────────────────────────
  const activeCount = clients.filter(c => c.active).length;
  const phoneCount  = clients.filter(c => c.phone).length;

  return (
    <>
      {/* ── Estadísticas rápidas (igual que Speeddansys) ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Clientes"
              value={clients.length}
              prefix={<TeamOutlined style={{ color: '#0d9488' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Activos"
              value={activeCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Con Teléfono"
              value={phoneCount}
              prefix={<PhoneOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Esta Página" value={filtered.length} />
          </Card>
        </Col>
      </Row>

      {/* ── Tabla principal ───────────────────────────── */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Clientes</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo cliente
          </Button>
        }
      >
        {/* Barra de búsqueda */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={14} md={10}>
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              prefix={<SearchOutlined />}
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Col>
          <Col>
            <Tooltip title="Limpiar búsqueda">
              <Button icon={<ReloadOutlined />} onClick={() => setSearch('')} />
            </Tooltip>
          </Col>
        </Row>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 600 }}
          pagination={{
            pageSize:        10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal:       (t, range) => `${range[0]}–${range[1]} de ${t} clientes`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <TeamOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  {search
                    ? 'Sin resultados. Intenta con otro término.'
                    : 'No hay clientes aún. Usa "+ Nuevo cliente".'}
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* ── Modal Crear / Editar ──────────────────────── */}
      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
              <FormField label="Nombre completo *">
                <SdInput {...register('fullName', { required: true })} placeholder="Juan Pérez" autoFocus />
              </FormField>
              <FormField label="Email *">
                <SdInput type="email" {...register('email', { required: true })} placeholder="juan@ejemplo.com" />
              </FormField>
              <FormField label="Teléfono">
                <SdInput {...register('phone')} placeholder="+503 7000-0000" />
              </FormField>
              {error && <p style={{ color: 'hsl(var(--status-error))', fontSize: 13, margin: 0 }}>{error}</p>}
            </div>
            <DialogFooter>
              <SdButton type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</SdButton>
              <SdButton type="submit" disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}</SdButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

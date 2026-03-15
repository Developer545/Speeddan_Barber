'use client';

// ══════════════════════════════════════════════════════════
// SERVICIOS — CRUD COMPLETO (patrón Speeddansys ERP)
// ══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Table, Card, Input, Button, Space, Row, Col,
  Statistic, Tag, Tooltip, Popconfirm, Typography, Select as AntSelect,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined, PlusOutlined, ReloadOutlined,
  ScissorOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, TagOutlined, DollarOutlined,
} from '@ant-design/icons';

// Componentes internos del formulario (react-hook-form)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button as SdButton }  from '@/components/ui/button';
import { Input as SdInput }    from '@/components/ui/input';
import { FormField }           from '@/components/shared/FormField';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const { Title, Text } = Typography;

// ── Tipos ──────────────────────────────────────────────────────────────────

type Service = {
  id: number; name: string; description: string | null;
  price: number; duration: number; category: string | null; active: boolean;
};

type FormValues = {
  name: string; description: string; price: string;
  duration: string; category: string; active: boolean;
};

const CATEGORIES: Record<string, string> = {
  cabello: 'Cabello', barba: 'Barba', combo: 'Combo', tratamiento: 'Tratamiento',
};

const CAT_COLORS: Record<string, string> = {
  cabello: 'blue', barba: 'purple', combo: 'cyan', tratamiento: 'green',
};

// ── Componente ─────────────────────────────────────────────────────────────

export default function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<Service | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');
  const [catFiltro, setCatFiltro] = useState<string | undefined>();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>();
  const selectedCategory = watch('category') ?? '';
  const activeVal        = watch('active');

  // Filtro cliente-side
  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFiltro || s.category === catFiltro;
    return matchSearch && matchCat;
  });

  // ── Abrir modal crear ──────────────────────────────────
  const handleNuevo = () => {
    setEditing(null);
    reset({ name: '', description: '', price: '', duration: '', category: 'cabello', active: true });
    setError('');
    setOpen(true);
  };

  // ── Abrir modal editar ─────────────────────────────────
  const handleEditar = (s: Service) => {
    setEditing(s);
    reset({
      name: s.name, description: s.description ?? '',
      price: String(s.price), duration: String(s.duration),
      category: s.category ?? 'cabello', active: s.active,
    });
    setError('');
    setOpen(true);
  };

  // ── Guardar (crear o editar) ───────────────────────────
  async function onSubmit(values: FormValues) {
    setSaving(true); setError('');
    try {
      const body = {
        name:        values.name,
        description: values.description || undefined,
        price:       parseFloat(values.price),
        duration:    parseInt(values.duration, 10),
        category:    values.category || undefined,
        active:      values.active,
      };
      const url = editing ? `/api/services/${editing.id}` : '/api/services';
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
        setServices(prev => prev.map(s => s.id === editing.id ? json.data : s));
        toast.success(`Servicio "${values.name}" actualizado`);
      } else {
        setServices(prev => [json.data, ...prev]);
        toast.success(`Servicio "${values.name}" creado`);
      }
      setOpen(false);
    } catch {
      setError('Error de red'); toast.error('Error de red');
    } finally { setSaving(false); }
  }

  // ── Eliminar (Popconfirm de antd) ──────────────────────
  async function handleEliminar(s: Service) {
    const res = await fetch(`/api/services/${s.id}`, { method: 'DELETE' });
    if (res.ok) {
      setServices(prev => prev.filter(x => x.id !== s.id));
      toast.success(`"${s.name}" eliminado`);
    } else { toast.error('No se pudo eliminar'); }
  }

  // ── Columnas de la tabla (patrón Speeddansys) ──────────
  const columns: ColumnsType<Service> = [
    {
      title:  'Servicio',
      key:    'name',
      render: (_, r) => (
        <div style={{ opacity: r.active ? 1 : 0.5 }}>
          <div style={{ fontWeight: 500 }}>{r.name}</div>
          {r.description && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {r.description.slice(0, 60)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title:     'Categoría',
      dataIndex: 'category',
      key:       'category',
      width:     120,
      render:    (v: string | null) => v
        ? <Tag color={CAT_COLORS[v] ?? 'default'} style={{ fontSize: 11 }}>{CATEGORIES[v] ?? v}</Tag>
        : <Text type="secondary">—</Text>,
    },
    {
      title:     'Precio',
      dataIndex: 'price',
      key:       'price',
      width:     100,
      align:     'right',
      render:    (v: number) => (
        <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
          ${v.toFixed(2)}
        </Text>
      ),
    },
    {
      title:     'Duración',
      dataIndex: 'duration',
      key:       'duration',
      width:     100,
      align:     'center',
      render:    (v: number) => <Text type="secondary">{v} min</Text>,
    },
    {
      title:     'Estado',
      dataIndex: 'active',
      key:       'active',
      width:     100,
      render:    (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? 'Activo' : 'Inactivo'}</Tag>
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
            title="¿Eliminar este servicio?"
            description="Esta acción no se puede deshacer."
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
  const activeCount = services.filter(s => s.active).length;
  const avgPrice    = services.length
    ? (services.reduce((a, s) => a + s.price, 0) / services.length).toFixed(2)
    : '0.00';
  const catsUsed    = new Set(services.map(s => s.category).filter(Boolean)).size;

  return (
    <>
      {/* ── Estadísticas rápidas (igual que Speeddansys) ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Servicios"
              value={services.length}
              prefix={<ScissorOutlined style={{ color: '#0d9488' }} />}
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
              title="Precio Promedio"
              value={`$${avgPrice}`}
              prefix={<DollarOutlined style={{ color: '#f59e0b' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Categorías"
              value={catsUsed}
              prefix={<TagOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Tabla principal ───────────────────────────── */}
      <Card
        title={<Title level={5} style={{ margin: 0 }}>Servicios</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNuevo}>
            Nuevo servicio
          </Button>
        }
      >
        {/* Barra de filtros */}
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Buscar por nombre o descripción..."
              prefix={<SearchOutlined />}
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <AntSelect
              placeholder="Categoría"
              allowClear
              style={{ width: '100%' }}
              value={catFiltro}
              onChange={v => setCatFiltro(v)}
              options={Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Col>
          <Col>
            <Tooltip title="Limpiar filtros">
              <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setCatFiltro(undefined); }} />
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
            showTotal:       (t, range) => `${range[0]}–${range[1]} de ${t} servicios`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <ScissorOutlined style={{ fontSize: 32, color: '#bfbfbf' }} />
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  {search || catFiltro
                    ? 'Sin resultados. Cambia los filtros.'
                    : 'No hay servicios aún. Usa "+ Nuevo servicio".'}
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
            <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
              <FormField label="Nombre *">
                <SdInput {...register('name', { required: true })} placeholder="Corte de cabello" autoFocus />
              </FormField>
              <FormField label="Descripción">
                <SdInput {...register('description')} placeholder="Descripción opcional" />
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Precio *">
                  <SdInput type="number" step="0.01" min="0" {...register('price', { required: true })} placeholder="10.00" />
                </FormField>
                <FormField label="Duración (min) *">
                  <SdInput type="number" min="1" {...register('duration', { required: true })} placeholder="30" />
                </FormField>
              </div>
              <FormField label="Categoría">
                <Select value={selectedCategory} onValueChange={v => setValue('category', v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={activeVal ?? true}
                  onChange={e => setValue('active', e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: 'hsl(var(--brand-primary))' }}
                />
                <span style={{ fontSize: 13, color: 'hsl(var(--text-secondary))' }}>Servicio activo</span>
              </label>
              {error && <p style={{ color: 'hsl(var(--status-error))', fontSize: 13, margin: 0 }}>{error}</p>}
            </div>
            <DialogFooter>
              <SdButton type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</SdButton>
              <SdButton type="submit" disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear servicio'}</SdButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

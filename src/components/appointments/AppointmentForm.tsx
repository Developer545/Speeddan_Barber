'use client';

// ══════════════════════════════════════════════════════════
// AppointmentForm — Formulario crear cita (antd Select)
// ══════════════════════════════════════════════════════════

import { useForm } from 'react-hook-form';
import { Button, Select } from 'antd';
import { Input }     from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';

type Barber  = { id: number; user: { fullName: string } };
type Service = { id: number; name: string; price: number; duration: number };
type Client  = { id: number; fullName: string };

type FormValues = {
  clientId: string; barberId: string; serviceId: string; startTime: string; notes: string;
};

type Props = {
  barbers:  Barber[];
  services: Service[];
  clients:  Client[];
  onSubmit: (data: FormValues) => Promise<void>;
  loading?: boolean;
  error?:   string;
};

export default function AppointmentForm({ barbers, services, clients, onSubmit, loading, error }: Props) {
  const { register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { clientId: '', barberId: '', serviceId: '', startTime: '', notes: '' },
  });

  const barberId  = watch('barberId')  || undefined;
  const serviceId = watch('serviceId') || undefined;
  const clientId  = watch('clientId')  || undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>

        <FormField label="Cliente *">
          <Select
            style={{ width: '100%' }}
            placeholder="Seleccionar cliente"
            value={clientId}
            onChange={v => setValue('clientId', v)}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={clients.map(c => ({ value: String(c.id), label: c.fullName }))}
          />
        </FormField>

        <FormField label="Barbero *">
          <Select
            style={{ width: '100%' }}
            placeholder="Seleccionar barbero"
            value={barberId}
            onChange={v => setValue('barberId', v)}
            options={barbers.map(b => ({ value: String(b.id), label: b.user.fullName }))}
          />
        </FormField>

        <FormField label="Servicio *">
          <Select
            style={{ width: '100%' }}
            placeholder="Seleccionar servicio"
            value={serviceId}
            onChange={v => setValue('serviceId', v)}
            options={services.map(s => ({
              value: String(s.id),
              label: `${s.name} — ${s.duration}min — $${s.price.toFixed(2)}`,
            }))}
          />
        </FormField>

        <FormField label="Fecha y hora *" id="appt-start">
          <Input
            id="appt-start"
            type="datetime-local"
            {...register('startTime', { required: true })}
          />
        </FormField>

        <FormField label="Notas" id="appt-notes">
          <Input id="appt-notes" {...register('notes')} placeholder="Observaciones opcionales..." />
        </FormField>

        {error && <p style={{ color: '#ff4d4f', fontSize: 13, margin: 0 }}>{error}</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          {loading ? 'Guardando...' : 'Crear cita'}
        </Button>
      </div>
    </form>
  );
}

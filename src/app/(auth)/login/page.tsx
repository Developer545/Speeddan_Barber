/**
 * Login page — 2 pasos igual que DTE Online.
 * Paso 1: código de empresa (slug)
 * Paso 2: email + contraseña
 * Usa CSS variables para todos los colores. Sin hardcode.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'empresa' | 'credenciales';

type TenantInfo = {
  id:          number;
  slug:        string;
  name:        string;
  logoUrl:     string | null;
  status:      string;
  themeConfig: Record<string, string>;
};

export default function LoginPage() {
  const router = useRouter();
  const [step,     setStep]     = useState<Step>('empresa');
  const [slug,     setSlug]     = useState(() => typeof window !== 'undefined' ? localStorage.getItem('barber_last_tenant') ?? '' : '');
  const [tenant,   setTenant]   = useState<TenantInfo | null>(null);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  // Aplicar tema del tenant si existe
  useEffect(() => {
    if (!tenant?.themeConfig) return;
    const root = document.documentElement;
    Object.entries(tenant.themeConfig).forEach(([key, val]) => {
      root.style.setProperty(key, val as string);
    });
    return () => {
      Object.keys(tenant.themeConfig).forEach(key => root.style.removeProperty(key));
    };
  }, [tenant]);

  const handleVerifyEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return setError('Ingresa el código de empresa');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/verify?slug=${slug.trim().toLowerCase()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Empresa no encontrada');
      setTenant(json.data);
      setStep('credenciales');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Email y contraseña son requeridos');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, slug: slug.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Credenciales inválidas');
      localStorage.setItem('barber_last_tenant', slug.trim().toLowerCase());
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'hsl(var(--bg-page))',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '40px 32px',
        background: 'hsl(var(--bg-surface))',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid hsl(var(--border-default))',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo / Nombre */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {tenant?.logoUrl
            ? <img src={tenant.logoUrl} alt={tenant.name} style={{ height: 48, margin: '0 auto 12px', display: 'block' }} />
            : <div style={{ width: 48, height: 48, background: 'hsl(var(--brand-primary))', borderRadius: 'var(--radius-md)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'hsl(var(--text-inverse))', fontSize: 22, fontWeight: 700 }}>&#x2702;</span>
              </div>
          }
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
            {tenant?.name ?? 'Speeddan Barbería'}
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginTop: 4 }}>
            {step === 'empresa' ? 'Ingresa el código de tu barbería' : 'Accede a tu cuenta'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'hsl(var(--status-error-bg))',
            border: '1px solid hsl(var(--status-error))',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'hsl(var(--status-error))',
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* PASO 1 */}
        {step === 'empresa' && (
          <form onSubmit={handleVerifyEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Código de empresa
              </label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="ej: mi-barberia"
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'hsl(var(--input-bg))',
                  border: '1px solid hsl(var(--input-border))',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 14, color: 'hsl(var(--input-text))',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px',
                background: loading ? 'hsl(var(--bg-muted))' : 'hsl(var(--btn-primary-bg))',
                color: 'hsl(var(--btn-primary-fg))',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 15, fontWeight: 700, width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Verificando...' : 'Continuar \u2192'}
            </button>
          </form>
        )}

        {/* PASO 2 */}
        {step === 'credenciales' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              type="button"
              onClick={() => { setStep('empresa'); setTenant(null); setError(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', fontSize: 13, padding: 0, textAlign: 'left', marginBottom: 4 }}
            >
              &larr; Cambiar empresa
            </button>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="email"
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(var(--input-bg))', border: '1px solid hsl(var(--input-border))', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'hsl(var(--input-text))', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contraseña
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                style={{ width: '100%', padding: '11px 14px', background: 'hsl(var(--input-bg))', border: '1px solid hsl(var(--input-border))', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'hsl(var(--input-text))', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '13px', background: loading ? 'hsl(var(--bg-muted))' : 'hsl(var(--btn-primary-bg))', color: 'hsl(var(--btn-primary-fg))', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 700, width: '100%', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

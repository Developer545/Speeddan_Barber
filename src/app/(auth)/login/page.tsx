/**
 * Login page — diseño split-screen premium.
 * Panel izquierdo: imagen barbería + glassmorphism + animaciones.
 * Panel derecho: dark teal profundo con formulario en modo oscuro.
 */

'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 'empresa' | 'credenciales';
type TenantInfo = {
  id: number; slug: string; name: string;
  logoUrl: string | null; status: string;
  themeConfig: Record<string, string>;
};

/* ── SVG Icons ────────────────────────────────────────────────────── */
function ScissorsIcon({ size = 32, color = 'white', strokeWidth = 1.6 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* ── Paleta dark-teal para el panel derecho ── */
const DK = {
  bg:         'linear-gradient(160deg, #0b1f1c 0%, #0f2a26 50%, #162e2a 100%)',
  card:       'rgba(255,255,255,0.055)',
  cardBorder: 'rgba(255,255,255,0.10)',
  input:      'rgba(255,255,255,0.07)',
  inputBorder:'rgba(255,255,255,0.16)',
  inputFocus: 'rgba(100,152,175,0.70)',
  label:      'rgba(255,255,255,0.50)',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.52)',
  errorBg:    'rgba(220,38,38,0.12)',
  errorBorder:'rgba(220,38,38,0.40)',
  errorText:  '#fca5a5',
  stepActive: '#6498AF',
  stepDone:   '#4ade80',
  btnHover:   'rgba(100,152,175,0.15)',
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
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!tenant?.themeConfig) return;
    const root = document.documentElement;
    Object.entries(tenant.themeConfig).forEach(([k, v]) => root.style.setProperty(k, v as string));
    return () => Object.keys(tenant.themeConfig).forEach(k => root.style.removeProperty(k));
  }, [tenant]);

  const handleVerifyEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return setError('Ingresa el código de empresa');
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`/api/tenant/verify?slug=${slug.trim().toLowerCase()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Empresa no encontrada');
      setTenant(json.data); setStep('credenciales');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError('Email y contraseña son requeridos');
    setError(null); setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, slug: slug.trim().toLowerCase() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Credenciales inválidas');
      localStorage.setItem('barber_last_tenant', slug.trim().toLowerCase());
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── Styles panel derecho (dark mode) ── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: DK.input,
    border: `1.5px solid ${DK.inputBorder}`,
    borderRadius: 10, fontSize: 14,
    color: DK.text, outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s, background 0.18s',
    fontFamily: 'var(--font-sans)',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: DK.label, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.7px',
  };
  const submitBtnStyle: React.CSSProperties = {
    padding: '13px',
    background: loading
      ? 'rgba(100,152,175,0.35)'
      : 'linear-gradient(135deg, #5D6474 0%, #6498AF 100%)',
    color: '#ffffff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, width: '100%',
    cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.3px', transition: 'opacity 0.15s, transform 0.1s',
    fontFamily: 'var(--font-sans)',
    boxShadow: loading ? 'none' : '0 4px 20px rgba(100,152,175,0.35)',
  };

  /* ── Glass card helper (panel izquierdo) ── */
  const glassCard = (style: React.CSSProperties = {}): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    border: '1px solid rgba(255,255,255,0.24)',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
    ...style,
  });

  return (
    <main style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)' }}>

      {/* ══════════════════════════════════════
          PANEL IZQUIERDO — imagen + cristal
          ══════════════════════════════════════ */}
      <div className="login-left-panel" style={{
        display: 'none', width: '48%', flexShrink: 0,
        background: 'hsl(175 60% 18%)',   /* fallback */
        position: 'relative', overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', padding: '60px 48px',
      }}>
        {/* CAPA 1 — Imagen real, ligeramente difuminada */}
        <div style={{
          position: 'absolute', inset: '-12px', zIndex: 0,
          backgroundImage: 'url("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=80")',
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(2px) brightness(0.52) saturate(1.15)',
          pointerEvents: 'none',
        }} />
        {/* CAPA 2 — Overlay teal cristal (más liviano para ver la imagen) */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(145deg, rgba(11,31,28,0.55) 0%, rgba(22,46,42,0.48) 50%, rgba(100,152,175,0.38) 100%)',
        }} />
        {/* CAPA 3 — Patrón diagonal sutil */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 52px),
            repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 52px)
          `,
        }} />
        {/* CAPA 4 — Orbes */}
        <div className="orb-top" style={{
          position: 'absolute', top: -120, right: -80, zIndex: 3,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,152,175,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -60, zIndex: 3,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,46,42,0.30) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ══ CONTENIDO ══ */}
        <div style={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 420 }}>
          {/* Logo + título */}
          <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72, borderRadius: 20, marginBottom: 20,
              background: 'rgba(255,255,255,0.16)',
              backdropFilter: 'blur(24px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
              border: '1px solid rgba(255,255,255,0.30)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.28)',
            }}>
              <ScissorsIcon size={34} color="white" strokeWidth={1.5} />
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-1px', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              Speeddan
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 400 }}>
              Sistema de gestión para barberías
            </p>
          </div>

          {/* Cards flotantes */}
          <div className="float-a" style={{ ...glassCard({ padding: '14px 20px', marginBottom: 14 }), display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarIcon />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>Gestión de Citas</div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, marginTop: 2 }}>Agenda online en tiempo real</div>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.30)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Activo
            </div>
          </div>

          <div className="float-b" style={{ ...glassCard({ padding: '14px 20px', marginBottom: 14 }), display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChartIcon />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>Reportes y Caja</div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, marginTop: 2 }}>Control financiero completo</div>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.30)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Activo
            </div>
          </div>

          <div className="float-c" style={{ ...glassCard({ padding: '14px 20px' }), display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UsersIcon />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>Gestión de Clientes</div>
              <div style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, marginTop: 2 }}>Historial y fidelización</div>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.30)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#4ade80', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Activo
            </div>
          </div>

          {/* Badge footer */}
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 100, padding: '8px 18px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: 500 }}>ERP Multi-tenant para barberías</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PANEL DERECHO — dark teal + formulario
          ══════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', minHeight: '100vh',
        background: DK.bg,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decoración fondo derecho — orbe sutil */}
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(100,152,175,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(22,46,42,0.60) 0%, transparent 70%)',
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, marginBottom: 18,
              background: 'linear-gradient(135deg, #5D6474 0%, #6498AF 100%)',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(100,152,175,0.40)',
            }}>
              <ScissorsIcon size={26} color="white" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: DK.text, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              {tenant?.name ?? 'Speeddan Barbería'}
            </h1>
            <p style={{ fontSize: 13, color: DK.muted, margin: 0 }}>
              {step === 'empresa' ? 'Ingresa el código de tu barbería' : 'Accede a tu cuenta'}
            </p>
          </div>

          {/* Indicador de pasos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: step === 'empresa'
                  ? 'linear-gradient(135deg, #5D6474, #6498AF)'
                  : DK.stepDone,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                boxShadow: step === 'empresa' ? '0 0 12px rgba(100,152,175,0.45)' : '0 0 10px rgba(74,222,128,0.45)',
              }}>
                {step === 'credenciales' ? '✓' : '1'}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === 'empresa' ? 700 : 400, color: step === 'empresa' ? DK.text : DK.muted }}>
                Empresa
              </span>
            </div>
            <div style={{ width: 36, height: 1.5, background: step === 'credenciales' ? DK.stepActive : 'rgba(255,255,255,0.15)', transition: 'background 0.3s', borderRadius: 2 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: step === 'credenciales'
                  ? 'linear-gradient(135deg, #5D6474, #6498AF)'
                  : 'rgba(255,255,255,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: step === 'credenciales' ? '#fff' : DK.muted,
                border: step === 'credenciales' ? 'none' : '1px solid rgba(255,255,255,0.15)',
                boxShadow: step === 'credenciales' ? '0 0 12px rgba(100,152,175,0.45)' : 'none',
              }}>
                2
              </div>
              <span style={{ fontSize: 12, fontWeight: step === 'credenciales' ? 700 : 400, color: step === 'credenciales' ? DK.text : DK.muted }}>
                Acceso
              </span>
            </div>
          </div>

          {/* Card del formulario */}
          <div style={{
            background: DK.card,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16,
            border: `1px solid ${DK.cardBorder}`,
            padding: '32px 28px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
          }}>
            {error && (
              <div style={{
                padding: '10px 14px',
                background: DK.errorBg,
                border: `1px solid ${DK.errorBorder}`,
                borderRadius: 8, fontSize: 13,
                color: DK.errorText, marginBottom: 20,
              }}>
                {error}
              </div>
            )}

            {/* PASO 1 */}
            {step === 'empresa' && (
              <form onSubmit={handleVerifyEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Código de empresa</label>
                  <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                    placeholder="ej: mi-barberia" autoFocus style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = DK.inputFocus; e.target.style.background = 'rgba(255,255,255,0.10)'; }}
                    onBlur={e =>  { e.target.style.borderColor = DK.inputBorder; e.target.style.background = DK.input; }}
                  />
                </div>
                <button type="submit" disabled={loading} style={submitBtnStyle}>
                  {loading ? 'Verificando...' : 'Continuar →'}
                </button>
              </form>
            )}

            {/* PASO 2 */}
            {step === 'credenciales' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <button type="button"
                  onClick={() => { setStep('empresa'); setTenant(null); setError(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: DK.muted, fontSize: 13, padding: 0, textAlign: 'left', marginBottom: -4, fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ← Cambiar empresa
                </button>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    autoFocus autoComplete="email" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = DK.inputFocus; e.target.style.background = 'rgba(255,255,255,0.10)'; }}
                    onBlur={e =>  { e.target.style.borderColor = DK.inputBorder; e.target.style.background = DK.input; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => { e.target.style.borderColor = DK.inputFocus; e.target.style.background = 'rgba(255,255,255,0.10)'; }}
                      onBlur={e =>  { e.target.style.borderColor = DK.inputBorder; e.target.style.background = DK.input; }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: DK.muted, display: 'flex', alignItems: 'center', padding: 0 }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} style={submitBtnStyle}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>
            )}
          </div>

          {/* Footer derecho */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Speeddan ERP · Sistema seguro
          </p>
        </div>
      </div>

      {/* ── Estilos y animaciones ── */}
      <style>{`
        @media (min-width: 768px) {
          .login-left-panel { display: flex !important; }
        }
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50%       { transform: translateY(-10px) rotate(0.5deg); }
        }
        @keyframes floatB {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50%       { transform: translateY(-8px) rotate(-0.5deg); }
        }
        @keyframes floatC {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        .float-a  { animation: floatA 5s ease-in-out infinite; }
        .float-b  { animation: floatB 6.5s ease-in-out infinite; animation-delay: 1s; }
        .float-c  { animation: floatC 7s ease-in-out infinite; animation-delay: 2s; }
        .anim-fade-up { animation: fadeUp 0.7s ease both; }
        .orb-top  { animation: orbPulse 8s ease-in-out infinite; }

        input::placeholder { color: rgba(255,255,255,0.28); }
      `}</style>
    </main>
  );
}

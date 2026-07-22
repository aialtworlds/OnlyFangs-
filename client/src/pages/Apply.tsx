// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Become a Creator (Onboarding Form)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Loader2 } from 'lucide-react';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40)
  );
}

export default function Apply() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    alias: '',
    handle: '',
    category: '',
    bio: '',
  });

  const [customHandle, setCustomHandle] = useState(false);

  const createProfile = trpc.creator.createProfile.useMutation({
    onSuccess: () => {
      toast.success('Perfil de criador ativado!', {
        description: 'Bem-vindo ao círculo dos criadores.',
      });
      // Invalidate the auth session so the frontend realizes the user is now a creator
      window.location.href = '/creator-dashboard';
    },
    onError: (err) => {
      toast.error('Erro ao ativar perfil', { description: err.message });
    },
  });

  // Auto-generate handle from alias/name
  useEffect(() => {
    if (!customHandle && form.alias) {
      setForm((prev) => ({ ...prev, handle: slugify(form.alias) }));
    }
  }, [form.alias, customHandle]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.alias || !form.handle) {
      toast.error('Nome e link (handle) são obrigatórios.');
      return;
    }
    createProfile.mutate({
      alias: form.alias,
      handle: form.handle,
      category: form.category || undefined,
      bio: form.bio || undefined,
    });
  };

  const categories = [
    'Vampire Nobility',
    'Dark Fashion',
    'Witch / Occultist',
    'Necromancer',
    'Dark Fantasy Artist',
    'Gothic Musician',
    'Victorian Photographer',
    'Dark Writer',
    'Dark Illustrator',
    'Other creature of the night',
  ];

  // Redirect if already creator
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'creator') {
      setLocation('/creator-dashboard');
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  if (authLoading) {
    return (
      <div style={containerStyle}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'oklch(0.72 0.09 75)' }} />
        <p style={{ marginTop: '16px' }}>Consultando o grimório...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🦇</div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '24px', color: 'oklch(0.93 0.02 80)', marginBottom: '12px' }}>
          Junte-se à Escuridão
        </h2>
        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '16px', color: 'oklch(0.55 0.03 60)', marginBottom: '32px', maxWidth: '360px' }}>
          Para se tornar um criador na OnlyFangs, você precisa primeiro criar uma conta.
        </p>
        <a href={getLoginUrl()} className="btn-crimson" style={{ padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }}>
          Criar Conta / Login
        </a>
      </div>
    );
  }

  return (
    <div style={{ background: 'oklch(0.04 0.008 285)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Hero */}
      <div
        style={{
          background: 'oklch(0.06 0.01 285)',
          borderBottom: '1px solid oklch(0.72 0.09 75 / 8%)',
          padding: '80px 0 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 50%, oklch(0.28 0.1 20 / 15%) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="tag-label">Torne-se um Criador</span>
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 900,
              color: 'oklch(0.93 0.02 80)',
              letterSpacing: '0.06em',
              lineHeight: 1.05,
              marginTop: '24px',
              marginBottom: '16px',
            }}
          >
            Abra o Seu Portal<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px oklch(0.72 0.09 75)', fontStyle: 'italic' }}>
              para a Noite
            </span>
          </h1>
          <p
            className="font-fell"
            style={{ fontSize: '18px', color: 'oklch(0.55 0.03 60)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.8 }}
          >
            Crie sua página instantaneamente e comece a reunir o seu círculo de patronos. Sem filas de aprovação, no modelo clássico do Patreon.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container" style={{ paddingTop: '60px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} style={{ background: 'oklch(0.085 0.015 330)', padding: '40px 32px', border: '1px solid oklch(0.72 0.09 75 / 20%)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, oklch(0.72 0.09 75), transparent)' }} />
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                Nome Artístico ou Pseudônimo *
              </label>
              <input
                className="input-dark"
                type="text"
                placeholder="Ex: Lady Carmilla"
                required
                value={form.alias}
                onChange={(e) => setForm({ ...form, alias: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                Link da sua Página (Handle) *
              </label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', color: 'oklch(0.45 0.02 60)', marginRight: '8px' }}>
                  onlyfangs.com/creator/
                </span>
                <input
                  className="input-dark"
                  type="text"
                  placeholder="ex: carmilla"
                  required
                  value={form.handle}
                  onChange={(e) => {
                    setCustomHandle(true);
                    setForm({ ...form, handle: slugify(e.target.value) });
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                Categoria *
              </label>
              <select
                className="input-dark"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ background: 'oklch(0.085 0.015 330)' }}
              >
                <option value="" disabled>Escolha sua categoria...</option>
                {categories.map((c) => (
                  <option key={c} value={c} style={{ background: 'oklch(0.085 0.015 330)' }}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                Sobre Você e sua Arte (Bio)
              </label>
              <textarea
                className="input-dark"
                rows={4}
                placeholder="Conte sobre suas obras e sua conexão com a noite..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={createProfile.isPending}
              className="btn-crimson"
              style={{ width: '100%', padding: '16px', fontSize: '11px', letterSpacing: '0.25em', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              {createProfile.isPending ? (
                <>
                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  Ativando Perfil...
                </>
              ) : (
                'Iniciar Página de Criador'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  background: 'oklch(0.04 0.008 285)',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  color: 'oklch(0.65 0.02 60)',
  fontFamily: "'IM Fell English', serif",
  fontStyle: 'italic' as const,
  textAlign: 'center' as const,
  padding: '20px',
};

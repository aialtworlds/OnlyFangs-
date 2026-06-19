// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Apply Page (Creator Application)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { toast } from 'sonner';

interface ApplyProps {
  onNavigate: (page: string) => void;
}

export default function Apply({ onNavigate }: ApplyProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: '',
    location: '',
    platform: '',
    audience: '',
    portfolio: '',
    description: '',
    vision: '',
    commit_content: false,
    commit_exclusive: false,
    commit_aesthetic: false,
    commit_terms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.commit_content || !form.commit_terms) {
      toast.error('Por favor, aceite os compromissos obrigatórios.');
      return;
    }
    try {
      const res = await fetch('https://formspree.io/f/xrevqvzr', {
        method: 'POST',
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        toast.error('Algo deu errado. Tente novamente.');
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  };

  const categories = [
    'Nobreza Vampírica',
    'Dark Fashion',
    'Bruxa / Ocultista',
    'Necromante',
    'Artista Dark Fantasy',
    'Músico Gótico',
    'Fotógrafo Vitoriano',
    'Escritor Sombrio',
    'Ilustrador Dark',
    'Outro ser da noite',
  ];

  if (submitted) {
    return (
      <div
        style={{
          background: 'oklch(0.04 0.008 285)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            background: 'oklch(0.085 0.015 330)',
            border: '1px solid oklch(0.72 0.09 75 / 20%)',
            padding: '60px 48px',
            textAlign: 'center',
            maxWidth: '560px',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, oklch(0.72 0.09 75), transparent)' }} />
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🩸</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '28px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.06em', marginBottom: '20px' }}>
            Sua Aplicação Entrou na Escuridão
          </h2>
          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '17px', color: 'oklch(0.55 0.03 60)', lineHeight: 1.8, marginBottom: '32px' }}>
            O coven recebeu sua submissão.<br /><br />
            <strong style={{ color: 'oklch(0.72 0.09 75)', fontWeight: 400, fontStyle: 'normal' }}>Aguarde resposta em até 72 horas.</strong><br /><br />
            Revisamos cada aplicação com a gravidade que merece. Se selecionado, você receberá um convite formal — não uma notificação. Um convite.
          </p>
          <button
            className="btn-outline"
            onClick={() => onNavigate('home')}
          >
            Retornar ao Vestíbulo
          </button>
        </div>
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
          <span className="tag-label">Aplicação de Criador Fundador</span>
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
            Aplique para Moldar<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px oklch(0.72 0.09 75)', fontStyle: 'italic' }}>
              a Noite
            </span>
          </h1>
          <p
            className="font-fell"
            style={{ fontSize: '18px', color: 'oklch(0.55 0.03 60)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.8 }}
          >
            Estamos selecionando um círculo fundador de criadores para definir a plataforma. Isto não é um formulário de registro. É um convite para co-autoria de uma era.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container" style={{ paddingTop: '60px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>

            {/* Section: Identity */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Identidade
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Nome ou Alias de Criador
                  </label>
                  <input className="input-dark" type="text" placeholder="Lady Nocturna" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Endereço de Email
                  </label>
                  <input className="input-dark" type="email" placeholder="voce@trevas.net" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Categoria de Criador
                  </label>
                  <select className="input-dark" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: 'oklch(0.085 0.015 330)' }}>
                    <option value="" disabled>Selecione sua espécie...</option>
                    {categories.map(c => <option key={c} value={c} style={{ background: 'oklch(0.085 0.015 330)' }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    País / Região
                  </label>
                  <input className="input-dark" type="text" placeholder="Onde você habita?" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Section: Presence */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Sua Presença
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Plataforma Principal Atual
                  </label>
                  <select className="input-dark" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ background: 'oklch(0.085 0.015 330)' }}>
                    <option value="" disabled>Onde você cria atualmente?</option>
                    {['Instagram', 'TikTok', 'Patreon', 'OnlyFans', 'YouTube', 'Substack', 'Twitter / X', 'Site pessoal', 'Múltiplas plataformas', 'Sou novo na criação'].map(p => (
                      <option key={p} value={p} style={{ background: 'oklch(0.085 0.015 330)' }}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Tamanho da Audiência Atual
                  </label>
                  <select className="input-dark" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} style={{ background: 'oklch(0.085 0.015 330)' }}>
                    <option value="" disabled>Total combinado...</option>
                    {['Menos de 1.000', '1.000 – 5.000', '5.000 – 20.000', '20.000 – 100.000', 'Mais de 100.000'].map(a => (
                      <option key={a} value={a} style={{ background: 'oklch(0.085 0.015 330)' }}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                  Link de Perfil ou Portfólio (opcional)
                </label>
                <input className="input-dark" type="url" placeholder="https://..." value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} />
              </div>
            </div>

            {/* Section: Dark Arts */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Suas Artes das Trevas
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                  Descreva seu conteúdo com suas próprias palavras
                </label>
                <textarea
                  className="input-dark"
                  rows={4}
                  placeholder="Conte-nos o que você cria, sua estética e por que você pertence ao Only Fangs..."
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                  Como seria seu conteúdo na plataforma?
                </label>
                <textarea
                  className="input-dark"
                  rows={3}
                  placeholder="Descreva os cofres que você abriria, os rituais que compartilharia..."
                  value={form.vision}
                  onChange={e => setForm({ ...form, vision: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Section: Commitment */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Compromisso
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'commit_content', label: 'Me comprometo a publicar pelo menos 4 obras por ciclo lunar', required: true },
                  { key: 'commit_exclusive', label: 'Estou disposto a oferecer conteúdo exclusivo não disponível em outras plataformas', required: false },
                  { key: 'commit_aesthetic', label: 'Meu conteúdo se alinha autenticamente com a estética gótica/dark — não como fantasia, mas como prática', required: false },
                  { key: 'commit_terms', label: 'Entendo que esta é uma aplicação fundadora e que nem todas as submissões serão aceitas', required: true },
                ].map(item => (
                  <label
                    key={item.key}
                    style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={form[item.key as keyof typeof form] as boolean}
                      onChange={e => setForm({ ...form, [item.key]: e.target.checked })}
                      required={item.required}
                      style={{
                        width: '16px',
                        height: '16px',
                        flexShrink: 0,
                        marginTop: '3px',
                        accentColor: 'oklch(0.72 0.09 75)',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: 'oklch(0.82 0.03 75)', lineHeight: 1.6 }}>
                      {item.label}
                      {item.required && <span style={{ color: 'oklch(0.42 0.16 20)', marginLeft: '4px' }}>*</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-crimson"
              style={{ width: '100%', padding: '16px', fontSize: '11px', letterSpacing: '0.25em', textAlign: 'center' }}
            >
              Submeter Aplicação ao Coven
            </button>
            <p
              style={{
                fontFamily: "'IM Fell English', serif",
                fontStyle: 'italic',
                fontSize: '13px',
                color: 'oklch(0.35 0.02 60)',
                textAlign: 'center',
                marginTop: '16px',
                lineHeight: 1.7,
              }}
            >
              Aplicações são revisadas em até 72 horas.<br />
              Você receberá uma resposta independentemente do resultado.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

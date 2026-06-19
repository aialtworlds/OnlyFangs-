// ═══════════════════════════════════════════════════════════
// ONLY FANGS — Apply Page (Creator Application)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';


export default function Apply() {
  const [, setLocation] = useLocation();
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
      toast.error('Please accept the required commitments.');
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
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    }
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

  if (submitted) {
    return (
      <div
        style={{
          background: 'oklch(0.04 0.008 285)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(16px, 5vw, 40px)',
        }}
      >
        <div
          style={{
            background: 'oklch(0.085 0.015 330)',
            border: '1px solid oklch(0.72 0.09 75 / 20%)',
            padding: 'clamp(32px, 6vw, 60px) clamp(20px, 6vw, 48px)',
            textAlign: 'center',
            maxWidth: '560px',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, oklch(0.72 0.09 75), transparent)' }} />
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🩸</div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '28px', color: 'oklch(0.93 0.02 80)', letterSpacing: '0.06em', marginBottom: '20px' }}>
            Your Application Has Entered the Darkness
          </h2>
          <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '17px', color: 'oklch(0.55 0.03 60)', lineHeight: 1.8, marginBottom: '32px' }}>
            The coven has received your submission.<br /><br />
            <strong style={{ color: 'oklch(0.72 0.09 75)', fontWeight: 400, fontStyle: 'normal' }}>We await your darkness.</strong><br /><br />
            We review each application with the gravity it deserves. If selected, you will receive a scroll of invitation.
          </p>
          <button
            className="btn-outline"
            onClick={() => setLocation('/')}
          >
            Return to the Vestibule
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
          <span className="tag-label">Founding Creator Application</span>
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
            Apply to Shape<br />
            <span style={{ color: 'transparent', WebkitTextStroke: '1px oklch(0.72 0.09 75)', fontStyle: 'italic' }}>
              the Night
            </span>
          </h1>
          <p
            className="font-fell"
            style={{ fontSize: '18px', color: 'oklch(0.55 0.03 60)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.8 }}
          >
            We are selecting a founding circle of creators to define the platform. This is not a form — it is an oath. It is an invitation to co-author an era.
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
                Identity
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Creator Name or Alias
                  </label>
                  <input className="input-dark" type="text" placeholder="Lady Nocturna" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <input className="input-dark" type="email" placeholder="you@darkness.net" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Creator Category
                  </label>
                  <select className="input-dark" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: 'oklch(0.085 0.015 330)' }}>
                    <option value="" disabled>Select your species...</option>
                    {categories.map(c => <option key={c} value={c} style={{ background: 'oklch(0.085 0.015 330)' }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Country / Region
                  </label>
                  <input className="input-dark" type="text" placeholder="Where do you dwell?" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Section: Presence */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Your Presence
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Current Primary Platform
                  </label>
                  <select className="input-dark" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ background: 'oklch(0.085 0.015 330)' }}>
                    <option value="" disabled>Where do you currently create?</option>
                    {['Instagram', 'TikTok', 'Patreon', 'OnlyFans', 'YouTube', 'Substack', 'Twitter / X', 'Personal website', 'Multiple platforms', 'I am new to creating'].map(p => (
                      <option key={p} value={p} style={{ background: 'oklch(0.085 0.015 330)' }}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                    Current Audience Size
                  </label>
                  <select className="input-dark" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} style={{ background: 'oklch(0.085 0.015 330)' }}>
                    <option value="" disabled>Combined total...</option>
                    {['Under 1,000', '1,000 – 5,000', '5,000 – 20,000', '20,000 – 100,000', 'Over 100,000'].map(a => (
                      <option key={a} value={a} style={{ background: 'oklch(0.085 0.015 330)' }}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                  Profile Link or Portfolio (optional)
                </label>
                <input className="input-dark" type="url" placeholder="https://..." value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} />
              </div>
            </div>

            {/* Section: Dark Arts */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Your Dark Arts
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                  Describe your content in your own words
                </label>
                <textarea
                  className="input-dark"
                  rows={4}
                  placeholder="Tell us what you create, your aesthetic and why you belong in the Only Fangs..."
                  required
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'oklch(0.55 0.03 60)', display: 'block', marginBottom: '8px' }}>
                  What would your content look like on the platform?
                </label>
                <textarea
                  className="input-dark"
                  rows={3}
                  placeholder="Describe the vaults you would open, the rituals you would share..."
                  value={form.vision}
                  onChange={e => setForm({ ...form, vision: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Section: Commitment */}
            <div style={{ marginBottom: '48px' }}>
              <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'oklch(0.72 0.09 75)', marginBottom: '28px', borderBottom: '1px solid oklch(0.72 0.09 75 / 15%)', paddingBottom: '14px' }}>
                Commitment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'commit_content', label: 'I commit to publishing at least 4 works per lunar cycle', required: true },
                  { key: 'commit_exclusive', label: 'I am willing to offer exclusive content not available on other platforms', required: false },
                  { key: 'commit_aesthetic', label: 'My content authentically aligns with the gothic/dark aesthetic — not as fantasy, but as practice', required: false },
                  { key: 'commit_terms', label: 'I understand this is a founding application and that all content must align with the Only Fangs aesthetic', required: true },
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
              Submit Application to the Coven
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
              Applications are reviewed within 72 hours.<br />
              You will receive a response regardless of the outcome.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

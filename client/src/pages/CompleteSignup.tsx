import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useLocation, useSearch } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'creator';
}

export default function CompleteSignup() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const params = new URLSearchParams(search);
  const role = params.get('role') === 'creator' ? 'creator' : 'patron';
  const nameParam = params.get('name') || '';

  const [alias, setAlias] = useState(nameParam);
  const [handle, setHandle] = useState(slugify(nameParam));
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const createProfile = trpc.creator.createProfile.useMutation();

  // Patrons don't need any extra step — being a logged-in user already
  // is being a patron. Send them straight to their dashboard.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return; // shouldn't happen, but don't redirect on a fluke
    if (role === 'patron') {
      setLocation('/patron-dashboard');
    }
  }, [authLoading, isAuthenticated, role, setLocation]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!alias.trim() || !handle.trim()) {
      toast.error('Please fill in your name and handle.');
      return;
    }
    setSubmitting(true);
    try {
      await createProfile.mutateAsync({
        alias: alias.trim(),
        handle: handle.trim(),
        category: category.trim() || undefined,
      });
      toast.success('Creator profile created!');
      setLocation('/creator-dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create your creator profile.'
      );
      setSubmitting(false);
    }
  };

  if (authLoading || (role === 'patron')) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'oklch(0.04 0.008 285)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'oklch(0.65 0.02 60)',
          fontFamily: "'IM Fell English', serif",
          fontStyle: 'italic',
        }}
      >
        Preparing your dashboard...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'oklch(0.04 0.008 285)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'oklch(0.65 0.02 60)',
          fontFamily: "'IM Fell English', serif",
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        Something went wrong signing you in. Please try again from the sign-up page.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'oklch(0.04 0.008 285)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Cinzel', serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'oklch(0.055 0.012 330)',
          border: '1px solid oklch(0.72 0.09 75 / 20%)',
          borderRadius: '8px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            color: 'oklch(0.93 0.02 80)',
            letterSpacing: '0.06em',
            marginBottom: '4px',
          }}
        >
          Set Up Your Creator Profile
        </h1>
        <p
          style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'oklch(0.55 0.03 60)',
            marginBottom: '8px',
          }}
        >
          Almost there — confirm your display name and choose a handle.
        </p>

        <div>
          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Handle</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(slugify(e.target.value))}
            style={inputStyle}
          />
          <p style={{ fontSize: '11px', color: 'oklch(0.45 0.02 60)', marginTop: '4px' }}>
            onlyfangs.social/creator/{handle || '...'}
          </p>
        </div>

        <div>
          <label style={labelStyle}>Category (optional)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Music, Photography, Writing"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '8px',
            padding: '12px 20px',
            background: submitting ? 'oklch(0.72 0.09 75 / 30%)' : 'oklch(0.72 0.09 75)',
            color: submitting ? 'oklch(0.55 0.03 60)' : 'oklch(0.04 0.008 285)',
            border: 'none',
            borderRadius: '4px',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 700,
          }}
        >
          {submitting ? 'Creating...' : 'Create Creator Profile'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: "'Cinzel', serif",
  fontSize: '11px',
  letterSpacing: '0.1em',
  color: 'oklch(0.72 0.09 75)',
  marginBottom: '6px',
  textTransform: 'uppercase',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'oklch(0.085 0.015 330)',
  border: '1px solid oklch(0.72 0.09 75 / 30%)',
  borderRadius: '4px',
  color: 'oklch(0.93 0.02 80)',
  fontFamily: "'IM Fell English', serif",
  fontSize: '14px',
  boxSizing: 'border-box',
};

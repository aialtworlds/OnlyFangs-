import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'creator'
  );
}

function randomSuffix(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function CompleteSignup() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const params = new URLSearchParams(search);
  const role = params.get('role') === 'creator' ? 'creator' : 'patron';

  const createProfile = trpc.creator.createProfile.useMutation();
  const attemptedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    const hasExplicitRole = params.has('role');

    // No role param means this came from a plain "Log In" link (an
    // existing user signing back in, not picking a role for the first
    // time). Just route them to whichever dashboard already matches their
    // account — never attempt to create a creator profile here.
    if (!hasExplicitRole) {
      setLocation(user?.role === 'creator' ? '/creator-dashboard' : '/patron-dashboard');
      return;
    }

    if (role === 'patron') {
      setLocation('/patron-dashboard');
      return;
    }

    // role === 'creator' — auto-create a minimal profile from the Google
    // name, no form to fill in. The creator can rename/adjust everything
    // afterwards from their dashboard settings.
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const baseName = (user?.name || 'Creator').trim();
    const baseHandle = slugify(baseName);

    const tryCreate = async (handle: string, isRetry: boolean) => {
      try {
        await createProfile.mutateAsync({ alias: baseName, handle });
        setLocation('/creator-dashboard');
      } catch (error) {
        if (!isRetry) {
          // Most likely cause of failure on the first try: the handle is
          // already taken. Retry once with a random suffix before
          // bothering the user with an error.
          await tryCreate(`${baseHandle}_${randomSuffix()}`, true);
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : 'Could not create your creator profile.'
        );
      }
    };

    tryCreate(baseHandle, false);
  }, [authLoading, isAuthenticated, role, user, setLocation, createProfile]);

  if (errorMessage) {
    return (
      <div style={containerStyle}>
        <p style={{ marginBottom: '16px' }}>{errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: 'oklch(0.72 0.09 75)',
            color: 'oklch(0.04 0.008 285)',
            border: 'none',
            borderRadius: '4px',
            fontFamily: "'Cinzel', serif",
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return <div style={containerStyle}>Setting up your dashboard...</div>;
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

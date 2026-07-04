import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * AdminCreatorManagement - Admin panel for managing creator verification
 * Allows admins to toggle verification status for creators from the database
 */
export function AdminCreatorManagement() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch all creators from database
  const creatorsQuery = trpc.public.allCreators.useQuery(undefined, {
    staleTime: 30000, // 30 seconds
  });

  const toggleVerification = trpc.admin.toggleCreatorVerification.useMutation({
    onSuccess: (data) => {
      toast.success(`Creator ${data.verified ? 'verified' : 'unverified'} successfully`);
      setTogglingId(null);
      // Invalidate and refetch creators list
      utils.public.allCreators.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to toggle verification');
      setTogglingId(null);
    },
  });

  // Filter creators based on search query
  const filteredCreators = useMemo(() => {
    if (!creatorsQuery.data) return [];
    return creatorsQuery.data.filter((creator: any) =>
      creator.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.id.toString().includes(searchQuery)
    );
  }, [creatorsQuery.data, searchQuery]);

  const handleToggleVerification = (creatorId: number) => {
    setTogglingId(creatorId);
    toggleVerification.mutate({ creatorId });
  };

  if (creatorsQuery.isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', marginBottom: '20px', color: 'oklch(0.93 0.02 80)' }}>
          Creator Verification Management
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (creatorsQuery.isError) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Failed to load creators. Please try again.</p>
      </Card>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '18px', marginBottom: '20px', color: 'oklch(0.93 0.02 80)' }}>
        Creator Verification Management
      </h2>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search creators by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'oklch(0.1 0.025 330)',
            border: '1px solid oklch(0.72 0.09 75 / 20%)',
            color: 'oklch(0.93 0.02 80)',
            borderRadius: '4px',
            fontFamily: "'Cinzel', serif",
            fontSize: '13px',
          }}
        />
      </div>

      {/* Creators Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid oklch(0.72 0.09 75 / 20%)' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: 'oklch(0.72 0.09 75)', fontFamily: "'Cinzel', serif", fontSize: '12px' }}>Creator</th>
              <th style={{ padding: '12px', textAlign: 'left', color: 'oklch(0.72 0.09 75)', fontFamily: "'Cinzel', serif", fontSize: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', color: 'oklch(0.72 0.09 75)', fontFamily: "'Cinzel', serif", fontSize: '12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCreators.map((creator: any) => (
              <tr key={creator.id} style={{ borderBottom: '1px solid oklch(0.1 0.025 330)' }}>
                <td style={{ padding: '12px', color: 'oklch(0.93 0.02 80)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {creator.avatarUrl && (
                      <img 
                        src={creator.avatarUrl} 
                        alt={creator.alias} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{creator.alias}</div>
                      <div style={{ fontSize: '12px', color: 'oklch(0.55 0.03 60)' }}>ID: {creator.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {creator.verified ? (
                      <>
                        <CheckCircle size={16} style={{ color: 'oklch(0.72 0.09 75)' }} />
                        <span style={{ color: 'oklch(0.72 0.09 75)' }}>Verified</span>
                      </>
                    ) : (
                      <>
                        <Circle size={16} style={{ color: 'oklch(0.45 0.02 60)' }} />
                        <span style={{ color: 'oklch(0.45 0.02 60)' }}>Unverified</span>
                      </>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleToggleVerification(creator.id)}
                    disabled={togglingId === creator.id}
                    style={{
                      padding: '6px 12px',
                      background: creator.verified ? 'oklch(0.45 0.02 60)' : 'oklch(0.72 0.09 75)',
                      color: creator.verified ? 'oklch(0.93 0.02 80)' : 'oklch(0.04 0.008 285)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: togglingId === creator.id ? 'not-allowed' : 'pointer',
                      fontFamily: "'Cinzel', serif",
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                      opacity: togglingId === creator.id ? 0.6 : 1,
                    }}
                  >
                    {togglingId === creator.id ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Updating...
                      </>
                    ) : creator.verified ? (
                      'Unverify'
                    ) : (
                      'Verify'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCreators.length === 0 && !creatorsQuery.isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'oklch(0.45 0.02 60)' }}>
          {searchQuery ? 'No creators found matching your search' : 'No creators available'}
        </div>
      )}
    </div>
  );
}

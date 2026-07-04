import { CheckCircle } from 'lucide-react';

interface VerificationBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeMap = {
  sm: { icon: 12, container: '16px' },
  md: { icon: 16, container: '20px' },
  lg: { icon: 20, container: '24px' },
};

/**
 * VerificationBadge - Displays a verified checkmark for creators
 * Shows a golden checkmark icon when creator is verified
 */
export function VerificationBadge({ verified, size = 'md', showTooltip = true }: VerificationBadgeProps) {
  if (!verified) return null;

  const { icon, container } = sizeMap[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: container,
        height: container,
        position: 'relative',
      }}
      title={showTooltip ? 'Verified Creator' : undefined}
    >
      <CheckCircle
        size={icon}
        style={{
          color: 'oklch(0.72 0.09 75)',
          fill: 'oklch(0.72 0.09 75)',
        }}
      />
    </div>
  );
}

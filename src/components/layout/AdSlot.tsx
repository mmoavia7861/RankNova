import React from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal-banner' | 'rectangle' | 'in-feed';
  className?: string;
  adSenseClientId?: string;
  enabled?: boolean;
}

/**
 * AdSense is NOT connected or approved in this repository.
 * Never show fake sponsor spaces, fake "configured" messages or ads near download/actions.
 * Replace this with a policy-compliant, real ad integration ONLY after account approval,
 * publisher verification, consent implementation and placement review.
 */
export const AdSlot: React.FC<AdSlotProps> = () => null;

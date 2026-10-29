import React from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'horizontal-banner' | 'rectangle' | 'in-feed';
  className?: string;
  adSenseClientId?: string;
  enabled?: boolean;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = 'default-slot',
  format = 'horizontal-banner',
  className = '',
  adSenseClientId,
  enabled = false
}) => {
  return (
    <div
      className={`my-8 p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-center select-none ${className}`}
      aria-label="Advertisement Container"
    >
      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1.5">
        Advertisement
      </div>
      <div className="flex items-center justify-center min-h-[85px] text-xs text-slate-500">
        {enabled && adSenseClientId ? (
          <div className="text-slate-600">
            Ad slot configured for {adSenseClientId} (Slot: {slotId})
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-slate-700 font-semibold">RankNova Sponsor Space</span>
            <p className="text-[11px] text-slate-400">
              AdSense integration ready • Distinctly separated from primary tools
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

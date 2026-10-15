import React from 'react';
import { LocationPriceResult } from '../lib/api';

interface LocationPricingPanelProps {
  locationPrice?: LocationPriceResult | null;
  claimedPrice?: number;
}

export const LocationPricingPanel: React.FC<LocationPricingPanelProps> = ({ 
  locationPrice, 
  claimedPrice 
}) => {
  if (!locationPrice) return null;

  const {
    location,
    matched_location,
    star_category,
    min_price,
    max_price,
    market_tier,
    notes,
    source,
    price_assessment,
    price_assessment_label
  } = locationPrice;

  // Evaluation status coloring
  let statusBg = 'rgba(0, 113, 227, 0.12)';
  let statusBorder = 'rgba(0, 113, 227, 0.35)';
  let statusColor = '#0071E3';

  if (price_assessment === 'IN_RANGE') {
    statusBg = 'rgba(5, 150, 105, 0.14)';
    statusBorder = 'rgba(5, 150, 105, 0.4)';
    statusColor = '#065F46';
  } else if (price_assessment === 'SUSPICIOUSLY_LOW') {
    statusBg = 'rgba(220, 38, 38, 0.14)';
    statusBorder = 'rgba(220, 38, 38, 0.4)';
    statusColor = '#991B1B';
  } else if (price_assessment === 'PREMIUM_PRICED') {
    statusBg = 'rgba(217, 119, 6, 0.14)';
    statusBorder = 'rgba(217, 119, 6, 0.4)';
    statusColor = '#92400E';
  }

  return (
    <div className="apple-card" style={{ 
      marginTop: '1.75rem', 
      marginBottom: '28px',
      padding: '26px', 
      borderRadius: '24px', 
      backgroundColor: 'rgba(255, 255, 255, 0.20)', 
      backdropFilter: 'blur(20px) saturate(170%)',
      WebkitBackdropFilter: 'blur(20px) saturate(170%)',
      border: '1.5px solid rgba(255, 255, 255, 0.42)',
      boxShadow: 'var(--shadow-glass)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11.5px', fontWeight: 850, letterSpacing: '0.09em', color: '#0071E3', marginBottom: '4px' }}>
            LOCATION PRICE INTELLIGENCE (RAG)
          </div>
          <h4 style={{ fontSize: '22px', fontWeight: 850, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
            {location || 'Regional Market'} Benchmark
          </h4>
          <div style={{ fontSize: '13.5px', color: '#1E293B', fontWeight: 700, marginTop: '4px' }}>
            Matched Region: <strong style={{ color: '#000000' }}>{matched_location}</strong> • <span style={{ color: '#334155' }}>{market_tier}</span>
          </div>
        </div>

        {price_assessment_label && (
          <div style={{
            background: statusBg,
            color: statusColor,
            padding: '7px 16px',
            borderRadius: '12px',
            fontWeight: 850,
            fontSize: '13.5px',
            border: `1.5px solid ${statusBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ fontSize: '9px' }}>●</span>
            {price_assessment_label}
          </div>
        )}
      </div>

      {/* Main Price Range Hero */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.22)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.45)',
        borderRadius: '18px',
        padding: '22px 26px',
        marginBottom: '22px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 850, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Expected {star_category}-Star Tariff Range
          </div>
          <div style={{ fontSize: '34px', fontWeight: 900, color: '#000000', letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span>₹{min_price.toLocaleString()}</span>
            <span style={{ fontSize: '22px', color: '#64748B', fontWeight: 600 }}>–</span>
            <span>₹{max_price.toLocaleString()}</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#334155', marginLeft: '6px' }}>/ night</span>
          </div>
        </div>

        {claimedPrice !== undefined && claimedPrice > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(12px)',
            padding: '14px 20px',
            borderRadius: '14px',
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            textAlign: 'right',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#000000', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Claimed Tariff
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: statusColor }}>
              ₹{claimedPrice.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>/ night</span>
            </div>
          </div>
        )}
      </div>

      {/* RAG Context Notes */}
      {notes && (
        <div style={{
          background: 'rgba(0, 113, 227, 0.08)',
          borderLeft: '4px solid #0071E3',
          borderRadius: '0 14px 14px 0',
          padding: '16px 20px',
          marginBottom: '18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 850, color: '#0071E3', marginBottom: '4px', letterSpacing: '0.06em' }}>
            REGIONAL MARKET CONTEXT (RAG SYNTHESIS)
          </div>
          <p style={{ margin: 0, fontSize: '14.5px', color: '#000000', fontWeight: 700, lineHeight: 1.6 }}>
            {notes}
          </p>
        </div>
      )}

      {/* Attribution footer */}
      {source && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
          <span>Source: {source}</span>
          <span style={{ color: '#0071E3' }}>ChromaDB Vector Retrieval Active</span>
        </div>
      )}
    </div>
  );
};

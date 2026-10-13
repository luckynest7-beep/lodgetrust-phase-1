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
  let statusBg = 'rgba(10, 132, 255, 0.15)';
  let statusBorder = 'rgba(10, 132, 255, 0.3)';
  let statusColor = '#0a84ff';

  if (price_assessment === 'IN_RANGE') {
    statusBg = 'rgba(52, 199, 89, 0.15)';
    statusBorder = 'rgba(52, 199, 89, 0.3)';
    statusColor = '#34c759';
  } else if (price_assessment === 'SUSPICIOUSLY_LOW') {
    statusBg = 'rgba(255, 69, 58, 0.15)';
    statusBorder = 'rgba(255, 69, 58, 0.3)';
    statusColor = '#ff453a';
  } else if (price_assessment === 'PREMIUM_PRICED') {
    statusBg = 'rgba(255, 159, 10, 0.15)';
    statusBorder = 'rgba(255, 159, 10, 0.3)';
    statusColor = '#ff9f0a';
  }

  return (
    <div className="apple-card" style={{ 
      marginTop: '1.5rem', 
      padding: '24px', 
      borderRadius: '20px', 
      backgroundColor: 'rgba(28, 28, 30, 0.7)', 
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#0a84ff', marginBottom: '6px' }}>
            LOCATION PRICE INTELLIGENCE (RAG)
          </div>
          <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
            {location || 'Regional Market'} Benchmark
          </h4>
          <div style={{ fontSize: '13px', color: '#86868b', marginTop: '4px' }}>
            Matched Region: <strong style={{ color: '#d2d2d7' }}>{matched_location}</strong> • <span style={{ color: '#a1a1a6' }}>{market_tier}</span>
          </div>
        </div>

        {price_assessment_label && (
          <div style={{
            background: statusBg,
            color: statusColor,
            padding: '6px 14px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '13px',
            border: `1px solid ${statusBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '8px' }}>●</span>
            {price_assessment_label}
          </div>
        )}
      </div>

      {/* Main Price Range Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Expected {star_category}-Star Tariff Range
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f5f5f7', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span>₹{min_price.toLocaleString()}</span>
            <span style={{ fontSize: '20px', color: '#86868b', fontWeight: 400 }}>–</span>
            <span>₹{max_price.toLocaleString()}</span>
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>/ night</span>
          </div>
        </div>

        {claimedPrice !== undefined && claimedPrice > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '2px', textTransform: 'uppercase' }}>
              Claimed Tariff
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: statusColor }}>
              ₹{claimedPrice.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b' }}>/ night</span>
            </div>
          </div>
        )}
      </div>

      {/* RAG Context Notes */}
      {notes && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderLeft: '3px solid #0a84ff',
          borderRadius: '0 12px 12px 0',
          padding: '14px 18px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0a84ff', marginBottom: '4px' }}>
            REGIONAL MARKET CONTEXT (RAG SYNTHESIS)
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#d2d2d7', lineHeight: 1.5 }}>
            {notes}
          </p>
        </div>
      )}

      {/* Attribution footer */}
      {source && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#636366' }}>
          <span>Source: {source}</span>
          <span>ChromaDB Vector Retrieval Active</span>
        </div>
      )}
    </div>
  );
};

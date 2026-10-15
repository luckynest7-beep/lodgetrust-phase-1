import React from 'react';
import { ComplianceResult } from '../lib/api';

interface CompliancePanelProps {
  compliance?: ComplianceResult | null;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ compliance }) => {
  if (!compliance) return null;

  const scorePct = Math.round((compliance.compliance_ratio || 0) * 100);
  const isHighCompliance = scorePct >= 70;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11.5px', fontWeight: 850, letterSpacing: '0.09em', color: '#0071E3', marginBottom: '4px' }}>
            MODULE D • RAG REGULATORY COMPLIANCE
          </div>
          <h4 style={{ fontSize: '22px', fontWeight: 850, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
            HRACC {compliance.star_claimed}-Star Standard Verification
          </h4>
        </div>
        <div style={{
          background: isHighCompliance ? 'rgba(5, 150, 105, 0.14)' : 'rgba(217, 119, 6, 0.14)',
          color: isHighCompliance ? '#065F46' : '#92400E',
          padding: '7px 16px',
          borderRadius: '12px',
          fontWeight: 850,
          fontSize: '15px',
          border: `1.5px solid ${isHighCompliance ? 'rgba(5, 150, 105, 0.4)' : 'rgba(217, 119, 6, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span>{scorePct}%</span>
          <span style={{ fontSize: '12.5px', fontWeight: 750 }}>Adherence</span>
        </div>
      </div>
      
      {compliance.error ? (
        <div style={{ 
          background: 'rgba(220, 38, 38, 0.12)', 
          border: '1.5px solid rgba(220, 38, 38, 0.35)', 
          color: '#991B1B', 
          padding: '14px 18px', 
          borderRadius: '14px', 
          fontSize: '14px',
          fontWeight: 750 
        }}>
          {compliance.error}
        </div>
      ) : (
        <div>
          {/* Progress bar */}
          <div style={{ height: '8px', background: 'rgba(148, 175, 198, 0.3)', borderRadius: '4px', overflow: 'hidden', marginBottom: '22px' }}>
            <div style={{ 
              height: '100%', 
              width: `${scorePct}%`, 
              backgroundColor: isHighCompliance ? '#059669' : '#D97706',
              borderRadius: '4px',
              transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }} />
          </div>

          {/* Two-column clean grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            
            {/* Met standards */}
            <div style={{ 
              background: 'rgba(5, 150, 105, 0.08)', 
              padding: '18px', 
              borderRadius: '16px', 
              border: '1.5px solid rgba(5, 150, 105, 0.25)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ fontSize: '14.5px', fontWeight: 800, color: '#065F46', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verified Standards
                </h5>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#065F46', background: 'rgba(5, 150, 105, 0.18)', padding: '3px 10px', borderRadius: '10px' }}>
                  {compliance.criteria_met} Met
                </span>
              </div>

              {(!compliance.met_list || compliance.met_list.length === 0) ? (
                <p style={{ color: '#334155', fontSize: '13.5px', margin: 0, fontWeight: 650, fontStyle: 'italic' }}>No standard amenities detected in photos.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compliance.met_list.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(10px)',
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      fontSize: '13.5px',
                      fontWeight: 750,
                      color: '#000000',
                      boxShadow: '0 2px 6px rgba(15, 30, 50, 0.04)'
                    }}>
                      <span style={{ color: '#059669', fontSize: '14px', fontWeight: 900 }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Missing standards */}
            <div style={{ 
              background: 'rgba(217, 119, 6, 0.08)', 
              padding: '18px', 
              borderRadius: '16px', 
              border: '1.5px solid rgba(217, 119, 6, 0.25)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h5 style={{ fontSize: '14.5px', fontWeight: 800, color: '#92400E', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  Not Observed in Photo(s)
                </h5>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#92400E', background: 'rgba(217, 119, 6, 0.18)', padding: '3px 10px', borderRadius: '10px' }}>
                  {compliance.missing.length} Unconfirmed
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 650, margin: '0 0 12px 0', lineHeight: 1.45 }}>
                Amenities not visibly confirmed in the provided image(s). Off-camera facilities (e.g. bathroom fittings or central AC) may exist but require multi-photo coverage.
              </p>

              {compliance.missing.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(5, 150, 105, 0.15)', borderRadius: '10px', color: '#065F46', fontSize: '13.5px', fontWeight: 800 }}>
                  <span>✓</span>
                  <span>All official {compliance.star_claimed}-Star regulatory standards satisfied!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compliance.missing.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.22)',
                      backdropFilter: 'blur(10px)',
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      fontSize: '13.5px',
                      fontWeight: 750,
                      color: '#000000',
                      boxShadow: '0 2px 6px rgba(15, 30, 50, 0.04)'
                    }}>
                      <span style={{ color: '#D97706', fontSize: '14px', fontWeight: 900 }}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div style={{ marginTop: '18px', fontSize: '12.5px', color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>ℹ️</span>
            <span>RAG audited against official Ministry of Tourism HRACC specifications for {compliance.star_claimed}-Star classification.</span>
          </div>
        </div>
      )}
    </div>
  );
};

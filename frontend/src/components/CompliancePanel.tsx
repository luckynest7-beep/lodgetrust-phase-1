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
      marginTop: '1.5rem', 
      padding: '24px', 
      borderRadius: '20px', 
      backgroundColor: 'rgba(28, 28, 30, 0.7)', 
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#0a84ff', marginBottom: '4px' }}>
            MODULE D • RAG REGULATORY COMPLIANCE
          </div>
          <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
            HRACC {compliance.star_claimed}-Star Standard Verification
          </h4>
        </div>
        <div style={{
          background: isHighCompliance ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)',
          color: isHighCompliance ? '#34c759' : '#ff9f0a',
          padding: '6px 14px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '14px',
          border: `1px solid ${isHighCompliance ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 149, 0, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{scorePct}%</span>
          <span style={{ fontSize: '12px', fontWeight: 500, opacity: 0.85 }}>Adherence</span>
        </div>
      </div>
      
      {compliance.error ? (
        <div style={{ 
          background: 'rgba(255, 59, 48, 0.1)', 
          border: '1px solid rgba(255, 59, 48, 0.3)', 
          color: '#ff3b30', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          fontSize: '14px' 
        }}>
          {compliance.error}
        </div>
      ) : (
        <div>
          {/* Progress bar */}
          <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ 
              height: '100%', 
              width: `${scorePct}%`, 
              backgroundColor: isHighCompliance ? '#34c759' : '#ff9f0a',
              borderRadius: '3px',
              transition: 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }} />
          </div>

          {/* Two-column clean grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Met standards */}
            <div style={{ 
              background: 'rgba(52, 199, 89, 0.04)', 
              padding: '16px', 
              borderRadius: '14px', 
              border: '1px solid rgba(52, 199, 89, 0.15)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#34c759', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verified Standards
                </h5>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#34c759', background: 'rgba(52, 199, 89, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                  {compliance.criteria_met} Met
                </span>
              </div>

              {(!compliance.met_list || compliance.met_list.length === 0) ? (
                <p style={{ color: '#8e8e93', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>No standard amenities detected in photos.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compliance.met_list.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '13px',
                      color: '#e5e5ea'
                    }}>
                      <span style={{ color: '#34c759', fontSize: '13px', fontWeight: 'bold' }}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Missing standards */}
            <div style={{ 
              background: 'rgba(255, 149, 0, 0.04)', 
              padding: '16px', 
              borderRadius: '14px', 
              border: '1px solid rgba(255, 149, 0, 0.15)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#ff9f0a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  Not Observed in Photo(s)
                </h5>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#ff9f0a', background: 'rgba(255, 149, 0, 0.15)', padding: '2px 8px', borderRadius: '10px' }}>
                  {compliance.missing.length} Unconfirmed
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#8e8e93', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                Amenities not visibly confirmed in the provided image(s). Off-camera facilities (e.g. bathroom fittings or central AC) may exist but require multi-photo coverage.
              </p>

              {compliance.missing.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'rgba(52, 199, 89, 0.08)', borderRadius: '8px', color: '#34c759', fontSize: '13px' }}>
                  <span>✓</span>
                  <span>All official {compliance.star_claimed}-Star regulatory standards satisfied!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compliance.missing.map((item, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '13px',
                      color: '#d2d2d7'
                    }}>
                      <span style={{ color: '#ff9f0a', fontSize: '12px' }}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: '#86868b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>ℹ️</span>
            <span>RAG audited against official Ministry of Tourism HRACC specifications for {compliance.star_claimed}-Star classification.</span>
          </div>
        </div>
      )}
    </div>
  );
};

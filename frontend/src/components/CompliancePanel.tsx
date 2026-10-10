import React from 'react';
import { ComplianceResult } from '../lib/api';

interface CompliancePanelProps {
  compliance?: ComplianceResult | null;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ compliance }) => {
  if (!compliance) return null;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: '#86868b', marginBottom: '4px' }}>
            MODULE D: COMPLIANCE RAG
          </div>
          <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#f5f5f7', margin: 0 }}>
            HRACC {compliance.star_claimed}-Star Hotel Compliance
          </h4>
        </div>
        <div style={{
          background: compliance.compliance_ratio > 0.8 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 204, 0, 0.15)',
          color: compliance.compliance_ratio > 0.8 ? '#34c759' : '#ffcc00',
          padding: '6px 12px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '14px',
          border: `1px solid ${compliance.compliance_ratio > 0.8 ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 204, 0, 0.3)'}`
        }}>
          {(compliance.compliance_ratio * 100).toFixed(0)}% Score
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
          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ 
              height: '100%', 
              width: `${compliance.compliance_ratio * 100}%`, 
              backgroundColor: compliance.compliance_ratio > 0.8 ? '#34c759' : '#ffcc00',
              borderRadius: '4px',
              transition: 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid rgba(255, 255, 255, 0.05)' 
            }}>
              <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#34c759', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Criteria Met ({compliance.criteria_met})
              </h5>
              {compliance.compliance_ratio === 0 ? (
                <span style={{ color: '#86868b', fontSize: '13px' }}>None</span>
              ) : (
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                  {compliance.met_list && compliance.met_list.map((item, idx) => (
                    <li key={idx} style={{ 
                      color: '#d2d2d7', 
                      fontSize: '13px', 
                      marginBottom: '8px',
                      paddingLeft: '16px',
                      position: 'relative',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ position: 'absolute', left: 0, top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: '#34c759' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid rgba(255, 255, 255, 0.05)' 
            }}>
              <h5 style={{ fontSize: '15px', fontWeight: 600, color: '#ff3b30', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Missing ({compliance.missing.length})
              </h5>
              {compliance.missing.length === 0 ? (
                <span style={{ color: '#86868b', fontSize: '13px' }}>All criteria met</span>
              ) : (
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                  {compliance.missing.map((item, idx) => (
                    <li key={idx} style={{ 
                      color: '#d2d2d7', 
                      fontSize: '13px', 
                      marginBottom: '8px',
                      paddingLeft: '16px',
                      position: 'relative',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ position: 'absolute', left: 0, top: '6px', width: '4px', height: '4px', borderRadius: '50%', background: '#ff3b30' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

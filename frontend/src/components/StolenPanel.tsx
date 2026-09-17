import React from 'react';
import { StolenResult } from '../lib/api';

interface StolenPanelProps {
  stolen: StolenResult | null;
}

export const StolenPanel: React.FC<StolenPanelProps> = ({ stolen }) => {
  if (!stolen) {
    return (
      <div className="apple-card">
        <div className="card-header-clean">
          <div className="eyebrow-label">B1 DUPLICATE SEARCH</div>
          <h3 className="section-title">Duplicate & Stolen Photo Check</h3>
        </div>
        <p className="empty-state-text">Signal unavailable</p>
      </div>
    );
  }

  const { is_flagged, matched_listing_id, matched_image_id, similarity_score } = stolen;
  const simPercent = Math.min(100, Math.max(0, Math.round(similarity_score * 100)));

  return (
    <div className={`apple-card ${is_flagged ? 'card-border-flagged' : ''}`}>
      <div className="card-header-clean">
        <div>
          <div className="eyebrow-label">B1 DUPLICATE SEARCH (FAISS CLIP)</div>
          <h3 className="section-title">Catalog Duplicate Check</h3>
        </div>
        <span className={`mono-badge ${is_flagged ? 'badge-danger' : 'badge-outline'}`}>
          {is_flagged ? '⚠ Reused Asset' : '✓ Original Asset'}
        </span>
      </div>

      <div className="card-body-clean">
        <div className="metric-row-clean">
          <span className="metric-name">Cross-Listing Similarity</span>
          <span className="metric-val font-mono">{(similarity_score * 100).toFixed(1)}%</span>
        </div>

        <div className="clean-track-bar mt-2" title={`Similarity: ${(similarity_score * 100).toFixed(1)}%`}>
          <div
            className={`clean-fill-bar ${is_flagged ? 'fill-flagged' : 'fill-clean'}`}
            style={{ width: `${simPercent}%` }}
          />
        </div>

        {is_flagged ? (
          <div className="flagged-alert-box mt-3">
            <div className="alert-badge-label">POTENTIAL DUPLICATE DETECTED</div>
            <div className="text-xs text-secondary mt-1">
              Near-duplicate match found in listing <code className="code-pill">{matched_listing_id || 'Unknown'}</code>
              {matched_image_id && (
                <> (asset <code className="code-pill">{matched_image_id}</code>)</>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-secondary mt-3">
            No near-duplicate images detected above the 95% cosine threshold in the verified catalog.
          </p>
        )}
      </div>
    </div>
  );
};


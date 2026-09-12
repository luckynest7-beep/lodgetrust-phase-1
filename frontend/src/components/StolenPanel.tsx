import React from 'react';
import { StolenResult } from '../lib/api';

interface StolenPanelProps {
  stolen: StolenResult | null;
}

export const StolenPanel: React.FC<StolenPanelProps> = ({ stolen }) => {
  if (!stolen) {
    return (
      <div className="card signal-card">
        <h3 className="card-title">B1 — Stolen / Reused Image Detection</h3>
        <p className="text-muted">Signal unavailable</p>
      </div>
    );
  }

  const { is_flagged, matched_listing_id, matched_image_id, similarity_score } = stolen;
  const simPercent = Math.min(100, Math.max(0, Math.round(similarity_score * 100)));

  return (
    <div className={`card signal-card ${is_flagged ? 'card-flagged' : 'card-clean'}`}>
      <div className="card-header">
        <h3 className="card-title">B1 — Stolen / Reused Image Detection</h3>
        <span className={`badge ${is_flagged ? 'badge-danger' : 'badge-success'}`}>
          {is_flagged ? '🚨 FLAGGED (Reused)' : '✅ Original Photo'}
        </span>
      </div>

      <div className="card-body">
        <div className="metric-row">
          <span className="metric-label">Similarity Score</span>
          <span className="metric-value font-mono">{(similarity_score * 100).toFixed(1)}%</span>
        </div>

        <div className="progress-bar-container" title={`Similarity: ${(similarity_score * 100).toFixed(1)}%`}>
          <div
            className={`progress-bar-fill ${is_flagged ? 'fill-danger' : 'fill-primary'}`}
            style={{ width: `${simPercent}%` }}
          />
        </div>

        {is_flagged ? (
          <div className="match-alert">
            <span className="alert-icon">🔍</span>
            <div>
              <strong>Duplicate Detected Across Listings</strong>
              <div className="text-sm">
                Matched Listing: <code className="code-pill">{matched_listing_id || 'Unknown'}</code>
                {matched_image_id && (
                  <> • Image ID: <code className="code-pill">{matched_image_id}</code></>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted mt-2">
            No near-duplicate images found from other listings above the 95% cosine threshold.
            {matched_listing_id && (
              <span> (Best match similarity: {matched_listing_id} at {(similarity_score * 100).toFixed(1)}%)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

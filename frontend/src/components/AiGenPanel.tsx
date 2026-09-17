import React from 'react';
import { AiDetectorResult } from '../lib/api';

interface AiGenPanelProps {
  aiData: AiDetectorResult | null;
}

export const AiGenPanel: React.FC<AiGenPanelProps> = ({ aiData }) => {
  if (!aiData) {
    return (
      <div className="apple-card">
        <div className="card-header-clean">
          <div className="eyebrow-label">B2 AI SYNTHESIS CHECK</div>
          <h3 className="section-title">Deepfake & AI Classifier</h3>
        </div>
        <p className="empty-state-text">Signal unavailable</p>
      </div>
    );
  }

  const { label, confidence, scores } = aiData;
  const isAi = label.toLowerCase() === 'artificial' || label.toLowerCase() === 'fake' || label.toLowerCase() === 'deepfake';

  return (
    <div className="apple-card">
      <div className="card-header-clean">
        <div>
          <div className="eyebrow-label">B2 SYNTHETIC ARTIFACT CHECK</div>
          <h3 className="section-title">AI & Deepfake Classifier</h3>
        </div>
        <span className={`mono-badge ${isAi ? 'badge-warning' : 'badge-dark'}`}>
          {isAi ? `⚠ ${label}` : `✓ Real Photography`}
        </span>
      </div>

      <div className="card-body-clean">
        <div className="metric-row-clean">
          <span className="metric-name">Top Prediction</span>
          <span className="metric-val font-mono">{label} ({(confidence * 100).toFixed(1)}%)</span>
        </div>

        <div className="class-scores-clean mt-3">
          <span className="text-xs text-secondary eyebrow-label">CLASS PROBABILITIES</span>
          {Object.entries(scores).map(([className, scoreVal]) => {
            const pct = Math.round(scoreVal * 100);
            return (
              <div className="clean-prob-row mt-2" key={className}>
                <div className="prob-label-row">
                  <span className="text-xs font-semibold">{className}</span>
                  <span className="text-xs font-mono text-secondary">{pct}%</span>
                </div>
                <div className="clean-track-bar">
                  <div
                    className="clean-fill-bar fill-clean"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-secondary mt-3">
          Photometric and structural frequency analysis. Deepfake indicators serve as advisory flags for human compliance review.
        </p>
      </div>
    </div>
  );
};


import React from 'react';
import { AiDetectorResult } from '../lib/api';

interface AiGenPanelProps {
  aiData: AiDetectorResult | null;
}

export const AiGenPanel: React.FC<AiGenPanelProps> = ({ aiData }) => {
  if (!aiData) {
    return (
      <div className="card signal-card">
        <h3 className="card-title">B2 — AI-Generated Image Detection</h3>
        <p className="text-muted">Signal unavailable</p>
      </div>
    );
  }

  const { label, confidence, scores } = aiData;
  const isAi = label.toLowerCase() === 'artificial' || label.toLowerCase() === 'ai_generated' || label.toLowerCase() === 'deepfake';

  return (
    <div className={`card signal-card ${isAi ? 'card-warning' : 'card-clean'}`}>
      <div className="card-header">
        <h3 className="card-title">B2 — AI-Generated Image Detection</h3>
        <span className={`badge ${isAi ? 'badge-warning' : 'badge-success'}`}>
          {isAi ? `⚠️ ${label}` : `📷 Real Photo`}
        </span>
      </div>

      <div className="card-body">
        <div className="metric-row">
          <span className="metric-label">Predicted Label</span>
          <span className="metric-value font-bold">{label} ({(confidence * 100).toFixed(1)}%)</span>
        </div>

        <div className="class-scores-list">
          <span className="text-sm font-semibold text-muted">Probability Distribution:</span>
          {Object.entries(scores).map(([className, scoreVal]) => {
            const pct = Math.round(scoreVal * 100);
            return (
              <div className="score-bar-row" key={className}>
                <div className="score-bar-label">
                  <span>{className}</span>
                  <span className="font-mono">{pct}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar-fill ${className.toLowerCase() === 'real' ? 'fill-success' : 'fill-warning'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="caveat-box">
          ℹ️ <strong>Note:</strong> Public AI detectors reflect probabilistic predictions. Treat synthetic scores as flags for human review.
        </div>
      </div>
    </div>
  );
};

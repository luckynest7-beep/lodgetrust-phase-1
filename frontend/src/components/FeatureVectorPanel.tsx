import React from 'react';
import { FeatureVector } from '../lib/api';

interface FeatureVectorPanelProps {
  vector: FeatureVector | null;
  title?: string;
}

export const FeatureVectorPanel: React.FC<FeatureVectorPanelProps> = ({
  vector,
  title = 'B3 — Quality, Style & Amenity Feature Vector',
}) => {
  if (!vector) {
    return (
      <div className="card signal-card">
        <h3 className="card-title">{title}</h3>
        <p className="text-muted">Feature vector unavailable</p>
      </div>
    );
  }

  const {
    style_tier,
    style_confidence,
    aesthetic_score,
    detected_objects,
    amenity_completeness_score,
  } = vector;

  const styleConfPct = style_confidence ? Math.round(style_confidence * 100) : 0;
  const aestheticPct = aesthetic_score ? Math.min(100, Math.max(0, Math.round((aesthetic_score / 10) * 100))) : 0;
  const amenityPct = amenity_completeness_score ? Math.round(amenity_completeness_score * 100) : 0;

  return (
    <div className="card signal-card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        {style_tier && (
          <span className={`badge ${style_tier === 'luxury' ? 'badge-purple' : 'badge-info'}`}>
            {style_tier === 'luxury' ? '✨ Luxury Tier' : '🏷️ Budget Tier'}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="feature-grid">
          {/* Style Tier Card */}
          <div className="feature-item">
            <div className="feature-label">B3a Style Tier</div>
            <div className="feature-value text-capitalize">
              {style_tier || 'N/A'}
            </div>
            {style_confidence !== null && (
              <div className="feature-sub">
                Confidence: <span className="font-mono">{styleConfPct}%</span>
              </div>
            )}
          </div>

          {/* Aesthetic Score Card */}
          <div className="feature-item">
            <div className="feature-label">B3b Aesthetic Score</div>
            <div className="feature-value font-mono">
              {aesthetic_score !== null ? aesthetic_score.toFixed(1) : 'N/A'} <span className="text-sm font-normal text-muted">/ 10</span>
            </div>
            <div className="progress-bar-container mt-1">
              <div className="progress-bar-fill fill-purple" style={{ width: `${aestheticPct}%` }} />
            </div>
          </div>

          {/* Amenity Completeness Card */}
          <div className="feature-item">
            <div className="feature-label">B3c Amenity Completeness</div>
            <div className="feature-value font-mono">
              {amenityPct}%
            </div>
            <div className="progress-bar-container mt-1">
              <div className="progress-bar-fill fill-success" style={{ width: `${amenityPct}%` }} />
            </div>
          </div>
        </div>

        {/* Detected Objects List */}
        <div className="detected-objects-section mt-3">
          <span className="text-sm font-semibold text-muted">Detected Furniture & Amenities:</span>
          {detected_objects && Object.keys(detected_objects).length > 0 ? (
            <div className="object-tags-wrapper mt-1">
              {Object.entries(detected_objects).map(([objName, count]) => (
                <span className="tag-pill" key={objName}>
                  <span className="tag-name">{objName}</span>
                  <span className="tag-count">×{count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mt-1">No furniture/amenity items detected in image.</p>
          )}
        </div>
      </div>
    </div>
  );
};

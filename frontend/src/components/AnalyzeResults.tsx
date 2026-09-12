import React, { useState } from 'react';
import { AnalyzeListingResponse } from '../lib/api';
import { StolenPanel } from './StolenPanel';
import { AiGenPanel } from './AiGenPanel';
import { FeatureVectorPanel } from './FeatureVectorPanel';
import { ErrorBanner } from './ErrorBanner';

interface AnalyzeResultsProps {
  data: AnalyzeListingResponse;
}

export const AnalyzeResults: React.FC<AnalyzeResultsProps> = ({ data }) => {
  const { results, aggregated } = data;
  const [activeTab, setActiveTab] = useState<number | 'aggregate'>('aggregate');

  if (!results || results.length === 0) {
    return null;
  }

  const selectedResult = typeof activeTab === 'number' ? results[activeTab] : null;

  return (
    <div className="results-container mt-4">
      {/* Navigation Tabs */}
      <div className="results-tabs">
        <button
          className={`tab-btn ${activeTab === 'aggregate' ? 'active' : ''}`}
          onClick={() => setActiveTab('aggregate')}
        >
          📊 Listing Aggregate Summary ({results.length} {results.length === 1 ? 'photo' : 'photos'})
        </button>

        {results.map((item, idx) => {
          const hasError = item.errors && item.errors.length > 0;
          const isFlagged = item.b1_stolen?.is_flagged;
          return (
            <button
              key={idx}
              className={`tab-btn ${activeTab === idx ? 'active' : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              {isFlagged && <span className="tab-indicator danger">🚨</span>}
              {hasError && <span className="tab-indicator warning">⚠️</span>}
              <span>Photo #{idx + 1}: {item.filename}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="results-content mt-3">
        {activeTab === 'aggregate' ? (
          <div>
            <div className="aggregate-intro-box">
              <h3>Listing-Level Feature Vector Synthesis</h3>
              <p className="text-sm text-muted">
                Aggregated signals across all {results.length} uploaded listing photo(s). This vector is directly consumed by Module C (Price Plausibility) and Module D (Compliance RAG).
              </p>
            </div>
            <FeatureVectorPanel vector={aggregated} title="Aggregated Listing Feature Vector" />

            <div className="per-image-summary-grid mt-4">
              <h4 className="section-subtitle">Per-Image Breakdown Overview</h4>
              <div className="overview-cards-wrapper">
                {results.map((res, idx) => (
                  <div
                    className="overview-card"
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="overview-card-header">
                      <span className="font-semibold">Photo #{idx + 1}</span>
                      <span className="text-muted text-sm">{res.filename}</span>
                    </div>
                    <div className="overview-card-tags">
                      {res.b1_stolen?.is_flagged ? (
                        <span className="badge badge-danger">🚨 Stolen Photo</span>
                      ) : (
                        <span className="badge badge-success">✅ Original</span>
                      )}
                      {res.b2_ai_generated && (
                        <span className="badge badge-info">
                          {res.b2_ai_generated.label} ({(res.b2_ai_generated.confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                      {res.b3_feature_vector?.style_tier && (
                        <span className="badge badge-purple">
                          {res.b3_feature_vector.style_tier}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedResult ? (
          <div className="single-photo-results">
            {selectedResult.errors && selectedResult.errors.length > 0 && (
              <ErrorBanner
                message={`Some sub-modules encountered warnings for file "${selectedResult.filename}"`}
                errors={selectedResult.errors}
              />
            )}

            <div className="photo-details-header">
              <h3>Detailed Analysis for: <code className="code-pill">{selectedResult.filename}</code></h3>
            </div>

            <div className="signals-grid mt-3">
              <StolenPanel stolen={selectedResult.b1_stolen} />
              <AiGenPanel aiData={selectedResult.b2_ai_generated} />
              <FeatureVectorPanel vector={selectedResult.b3_feature_vector} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

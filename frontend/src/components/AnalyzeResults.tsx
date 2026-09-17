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
      {/* Apple-style Segmented Navigation */}
      <div className="segmented-control-bar">
        <button
          className={`segment-tab ${activeTab === 'aggregate' ? 'active' : ''}`}
          onClick={() => setActiveTab('aggregate')}
        >
          <span className="tab-icon">✦</span>
          <span>Listing Aggregate ({results.length} {results.length === 1 ? 'photo' : 'photos'})</span>
        </button>

        {results.map((item, idx) => {
          const hasError = item.errors && item.errors.length > 0;
          const isFlagged = item.b1_stolen?.is_flagged;
          const isAi = item.b2_ai_generated?.label.toLowerCase() === 'fake' || item.b2_ai_generated?.label.toLowerCase() === 'artificial';
          return (
            <button
              key={idx}
              className={`segment-tab ${activeTab === idx ? 'active' : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              {isFlagged && <span className="tab-status-dot dot-danger" title="Flagged as stolen / reused" />}
              {isAi && <span className="tab-status-dot dot-warning" title="AI-generated flag" />}
              {hasError && <span className="tab-status-dot dot-subtle" title="Warning / error" />}
              <span>Photo #{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div className="results-content mt-4">
        {activeTab === 'aggregate' ? (
          <div>
            <div className="aggregate-intro-clean mb-4">
              <div className="eyebrow-label">LISTING-LEVEL SYNTHESIS</div>
              <h3 className="section-title">Aggregated Multimodal Intelligence</h3>
              <p className="section-desc">
                Synthesized quality signals, lighting geometry, color harmonies, and amenity inventory across all {results.length} property photo(s).
              </p>
            </div>

            <FeatureVectorPanel
              vector={aggregated}
              title="Listing Composite Quality & Aesthetic Synthesis"
              isAggregate={true}
            />

            <div className="per-image-overview-section mt-5">
              <div className="eyebrow-label">INDIVIDUAL ASSET SUMMARY</div>
              <h4 className="section-subtitle">Per-Photo Signal Breakdown</h4>
              <div className="asset-grid mt-3">
                {results.map((res, idx) => {
                  const compScore = res.b3_feature_vector?.composite_aesthetic?.composite_score ?? res.b3_feature_vector?.aesthetic_score;
                  return (
                    <div
                      className="asset-summary-card"
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="asset-card-top">
                        <div className="asset-index">Photo #{idx + 1}</div>
                        {compScore !== undefined && compScore !== null && (
                          <div className="asset-score-badge">
                            {compScore.toFixed(1)} <span className="text-xs">/10</span>
                          </div>
                        )}
                      </div>
                      <div className="asset-filename" title={res.filename}>
                        {res.filename}
                      </div>

                      <div className="asset-chips-row mt-2">
                        {res.b1_stolen?.is_flagged ? (
                          <span className="mono-badge badge-danger">Reused</span>
                        ) : (
                          <span className="mono-badge badge-outline">Original</span>
                        )}
                        {res.b2_ai_generated && (
                          <span className={`mono-badge ${res.b2_ai_generated.label.toLowerCase() === 'fake' ? 'badge-warning' : 'badge-subtle'}`}>
                            {res.b2_ai_generated.label}
                          </span>
                        )}
                        {res.b3_feature_vector?.style_tier && (
                          <span className="mono-badge badge-dark">
                            {res.b3_feature_vector.style_tier}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : selectedResult ? (
          <div className="single-photo-results">
            {selectedResult.errors && selectedResult.errors.length > 0 && (
              <ErrorBanner
                message={`Sub-module warnings detected for "${selectedResult.filename}"`}
                errors={selectedResult.errors}
              />
            )}

            <div className="photo-details-header mb-3">
              <div className="eyebrow-label">INDIVIDUAL ASSET DETAIL</div>
              <h3 className="section-title">
                Photo #{activeTab as number + 1}: <code className="code-pill">{selectedResult.filename}</code>
              </h3>
            </div>

            {/* B3 Feature Vector (with composite aesthetic, lighting, palette) */}
            <FeatureVectorPanel
              vector={selectedResult.b3_feature_vector}
              title={`Asset Score Breakdown — ${selectedResult.filename}`}
            />

            {/* B1 and B2 Side by Side Grid */}
            <div className="signals-dual-grid mt-4">
              <StolenPanel stolen={selectedResult.b1_stolen} />
              <AiGenPanel aiData={selectedResult.b2_ai_generated} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};


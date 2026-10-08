import React, { useState } from 'react';
import { FeatureVector } from '../lib/api';

interface FeatureVectorPanelProps {
  vector: FeatureVector | null;
  title?: string;
  isAggregate?: boolean;
}

export const FeatureVectorPanel: React.FC<FeatureVectorPanelProps> = ({
  vector,
  title = 'Aesthetic & Feature Vector Intelligence',
  isAggregate = false,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!vector) {
    return (
      <div className="apple-card">
        <div className="card-header-clean">
          <h3 className="section-title">{title}</h3>
        </div>
        <p className="empty-state-text">Feature vector unavailable</p>
      </div>
    );
  }

  const {
    style_tier,
    style_confidence,
    tier_scores,
    aesthetic_score,
    detected_objects,
    amenity_completeness_score,
    expected_amenities,
    matched_amenities,
    missing_amenities,
    lighting_analysis,
    color_analysis,
    composite_aesthetic,
  } = vector;

  const styleConfPct = style_confidence ? Math.round(style_confidence * 100) : 0;
  const compositeScore = composite_aesthetic?.composite_score ?? (aesthetic_score ?? 0);
  const visionScore = composite_aesthetic?.vision_score ?? (aesthetic_score ?? 0);
  const lightingScore = composite_aesthetic?.lighting_score ?? (lighting_analysis?.lighting_score ?? 0);
  const colorScore = composite_aesthetic?.color_score ?? (color_analysis?.color_harmony_score ?? 0);
  const amenityPct = amenity_completeness_score !== null && amenity_completeness_score !== undefined
    ? Math.round(amenity_completeness_score * 100)
    : 0;

  // Format tier label
  const getTierLabel = (tier: string | null) => {
    switch (tier?.toLowerCase()) {
      case 'budget':
        return '🏷️ Economy / Budget Tier';
      case 'midscale':
        return '🏨 Standard / Midscale Tier';
      case 'upscale':
        return '✨ Upscale / Premium Boutique';
      case 'luxury':
        return '✦ Ultra Luxury 5-Star';
      default:
        return tier ? `✦ ${tier.toUpperCase()}` : 'Unclassified';
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  return (
    <div className="apple-card mb-4">
      {/* Header */}
      <div className="card-header-clean">
        <div>
          <div className="eyebrow-label">
            {isAggregate ? 'LISTING AGGREGATE SYNTHESIS' : 'MULTIMODAL SIGNAL ANALYSIS'}
          </div>
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="header-tags">
          {style_tier && (
            <span className={`mono-badge ${style_tier === 'luxury' || style_tier === 'upscale' ? 'badge-dark' : 'badge-subtle'}`}>
              {getTierLabel(style_tier)}
            </span>
          )}
          {lighting_analysis?.is_balanced && (
            <span className="mono-badge badge-outline">
              ✓ Balanced Illumination
            </span>
          )}
        </div>
      </div>

      {/* Composite Aesthetic Score Banner */}
      <div className="composite-hero-box">
        <div className="composite-score-left">
          <span className="score-hero-label">COMPOSITE AESTHETIC RATING</span>
          <div className="score-hero-value">
            <span className="hero-number">{compositeScore.toFixed(1)}</span>
            <span className="hero-scale">/ 10.0</span>
          </div>
          <div className="score-meter-wrap">
            <div
              className="score-meter-bar"
              style={{ width: `${Math.min(100, Math.max(10, compositeScore * 10))}%` }}
            />
          </div>
        </div>

        <div className="composite-submetrics-grid">
          {/* Vision Model (40%) */}
          <div className="submetric-item">
            <div className="submetric-top">
              <span className="submetric-name">Vision Model</span>
              <span className="submetric-weight">40% wt</span>
            </div>
            <div className="submetric-score">{visionScore.toFixed(1)} <span className="submetric-denom">/10</span></div>
            <div className="submetric-track">
              <div className="submetric-fill" style={{ width: `${visionScore * 10}%` }} />
            </div>
          </div>

          {/* Lighting Quality (25%) */}
          <div className="submetric-item">
            <div className="submetric-top">
              <span className="submetric-name">Lighting & Atmosphere</span>
              <span className="submetric-weight">25% wt</span>
            </div>
            <div className="submetric-score">{lightingScore.toFixed(1)} <span className="submetric-denom">/10</span></div>
            <div className="submetric-track">
              <div className="submetric-fill" style={{ width: `${lightingScore * 10}%` }} />
            </div>
          </div>

          {/* Color Harmony (20%) */}
          <div className="submetric-item">
            <div className="submetric-top">
              <span className="submetric-name">Color Harmony</span>
              <span className="submetric-weight">20% wt</span>
            </div>
            <div className="submetric-score">{colorScore.toFixed(1)} <span className="submetric-denom">/10</span></div>
            <div className="submetric-track">
              <div className="submetric-fill" style={{ width: `${colorScore * 10}%` }} />
            </div>
          </div>

          {/* Amenity Completeness (15%) */}
          <div className="submetric-item">
            <div className="submetric-top">
              <span className="submetric-name">Amenity Inventory</span>
              <span className="submetric-weight">15% wt</span>
            </div>
            <div className="submetric-score">{amenityPct}% <span className="submetric-denom">match</span></div>
            <div className="submetric-track">
              <div className="submetric-fill" style={{ width: `${amenityPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 1 Bento Grid: Lodging Tier Spectrum & Amenity Completeness */}
      <div className="bento-split-grid mt-4">
        {/* Lodging Tier Classification Module */}
        <div className="bento-tile">
          <div className="bento-tile-header">
            <span className="tile-category">B3A LODGING TIER CLASSIFICATION</span>
            <span className="mono-badge badge-dark font-mono">
              {styleConfPct}% Confidence
            </span>
          </div>

          <div className="tier-hero-banner">
            <span className="tier-hero-title">{getTierLabel(style_tier)}</span>
            <span className="text-xs text-secondary mt-1">
              Evaluated against architectural finish, furnishing caliber, and spatial quality criteria.
            </span>
          </div>

          {/* 4-Tier Spectrum Bars */}
          <div className="tier-spectrum-list mt-3">
            {[
              { id: 'budget', label: 'Economy / Budget Motel', color: '#A1A1AA' },
              { id: 'midscale', label: 'Standard / Midscale Hotel', color: '#D4D4D8' },
              { id: 'upscale', label: 'Upscale / Premium Boutique', color: '#E4E4E7' },
              { id: 'luxury', label: 'Ultra Luxury 5-Star Suite', color: '#FFFFFF' },
            ].map((t) => {
              const scoreVal = tier_scores ? tier_scores[t.id] ?? 0 : (style_tier === t.id ? 1.0 : 0.0);
              const pct = Math.round(scoreVal * 100);
              const isWinner = style_tier === t.id;
              return (
                <div className={`tier-row ${isWinner ? 'winner' : ''}`} key={t.id}>
                  <div className="tier-row-top">
                    <span className="tier-name">
                      {isWinner ? '✦ ' : ''}{t.label}
                    </span>
                    <span className="tier-pct font-mono">{pct}%</span>
                  </div>
                  <div className="tier-track">
                    <div
                      className="tier-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isWinner ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Amenity Completeness & Standard Checklist Module */}
        <div className="bento-tile">
          <div className="bento-tile-header">
            <span className="tile-category">B3C AMENITY COMPLETENESS</span>
            <span className="mono-badge badge-subtle font-mono">
              {amenityPct}% Completeness
            </span>
          </div>

          <div className="amenity-hero-score-wrap">
            <div className="amenity-score-large font-mono">{amenityPct}%</div>
            <div className="amenity-score-desc">
              <strong>Lodging Standard Match</strong>
              <div className="text-xs text-secondary mt-0.5">
                {(matched_amenities || []).length} of {(expected_amenities || []).length} expected baseline amenities verified in photos.
              </div>
            </div>
          </div>

          {/* Standard Amenities Checklist */}
          <div className="amenity-checklist-box mt-3">
            <span className="eyebrow-label">STANDARD AMENITY CRITERIA</span>
            <div className="checklist-items-grid mt-2">
              {(expected_amenities || ['bed', 'chair', 'couch', 'tv', 'dining table', 'toilet', 'sink', 'refrigerator', 'microwave']).map((item) => {
                const count = detected_objects ? detected_objects[item.toLowerCase()] || 0 : 0;
                const isMatched = count > 0 || (matched_amenities || []).includes(item.toLowerCase());
                return (
                  <div className={`checklist-item ${isMatched ? 'matched' : 'missing'}`} key={item}>
                    <span className="checklist-icon">{isMatched ? '✓' : '✕'}</span>
                    <span className="checklist-name">{item}</span>
                    <span className="checklist-count font-mono">
                      {isMatched ? `(${count} found)` : '(Missing)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Bento Grid: Lighting & Color Palettes */}
      <div className="bento-split-grid mt-4">
        {/* Color Scheme Module */}
        {color_analysis && (
          <div className="bento-tile">
            <div className="bento-tile-header">
              <span className="tile-category">COLOR SCHEME & PALETTE</span>
              <span className="mono-badge badge-subtle">
                {color_analysis.harmony_type}
              </span>
            </div>

            {/* Dominant Swatches Bar */}
            {color_analysis.dominant_palette && color_analysis.dominant_palette.length > 0 && (
              <div className="palette-strip-container">
                <div className="palette-strip-bar">
                  {color_analysis.dominant_palette.map((swatch, idx) => (
                    <div
                      key={idx}
                      className="swatch-segment"
                      style={{
                        backgroundColor: swatch.hex,
                        width: `${Math.max(12, swatch.percentage)}%`,
                      }}
                      title={`${swatch.hex} (${swatch.percentage}%) - Click to copy`}
                      onClick={() => handleCopyHex(swatch.hex)}
                    />
                  ))}
                </div>

                {/* Swatch detail chips */}
                <div className="swatch-chips-row">
                  {color_analysis.dominant_palette.map((swatch, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={`swatch-chip ${copiedHex === swatch.hex ? 'copied' : ''}`}
                      onClick={() => handleCopyHex(swatch.hex)}
                      title="Click to copy hex code"
                    >
                      <span className="swatch-dot" style={{ backgroundColor: swatch.hex }} />
                      <span className="swatch-hex">{swatch.hex}</span>
                      <span className="swatch-pct">{swatch.percentage}%</span>
                    </button>
                  ))}
                </div>
                {copiedHex && (
                  <div className="copy-feedback">Copied {copiedHex} to clipboard</div>
                )}
              </div>
            )}

            {/* Temperature & Saturation Metrics */}
            <div className="tile-metric-rows">
              <div className="tile-metric-row">
                <span className="metric-name">Temperature Balance</span>
                <span className="metric-val text-capitalize">
                  {color_analysis.warm_tone_pct}% Warm / {color_analysis.cool_tone_pct}% Cool ({color_analysis.color_temperature})
                </span>
              </div>
              <div className="tile-metric-row">
                <span className="metric-name">Saturation Style</span>
                <span className="metric-val text-capitalize">
                  {color_analysis.saturation_level.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Lighting & Illumination Module */}
        {lighting_analysis && (
          <div className="bento-tile">
            <div className="bento-tile-header">
              <span className="tile-category">LIGHTING & ATMOSPHERE</span>
              <span className="mono-badge badge-dark">
                {lighting_analysis.lighting_atmosphere}
              </span>
            </div>

            <div className="lighting-stats-grid">
              <div className="lighting-stat-box">
                <span className="stat-label">Luminance</span>
                <span className="stat-number">{lighting_analysis.mean_brightness}%</span>
                <span className="stat-desc text-capitalize">{lighting_analysis.exposure_category.replace('_', ' ')}</span>
              </div>
              <div className="lighting-stat-box">
                <span className="stat-label">Dynamic Contrast</span>
                <span className="stat-number">{lighting_analysis.contrast}</span>
                <span className="stat-desc">Std Dev</span>
              </div>
              <div className="lighting-stat-box">
                <span className="stat-label">Highlight Clip</span>
                <span className="stat-number">{lighting_analysis.highlight_clipping_pct}%</span>
                <span className="stat-desc">{lighting_analysis.highlight_clipping_pct < 5 ? 'Minimal' : 'Elevated'}</span>
              </div>
              <div className="lighting-stat-box">
                <span className="stat-label">Shadow Clip</span>
                <span className="stat-number">{lighting_analysis.shadow_clipping_pct}%</span>
                <span className="stat-desc">{lighting_analysis.shadow_clipping_pct < 5 ? 'Clean' : 'Deep blacks'}</span>
              </div>
            </div>

            <div className="tile-metric-rows mt-3">
              <div className="tile-metric-row">
                <span className="metric-name">Exposure Balance</span>
                <span className="metric-val">
                  {lighting_analysis.is_balanced ? '✓ Optimal Natural Lighting' : '⚠ Non-Uniform Illumination'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Detected Inventory Chips */}
      <div className="amenity-inventory-section mt-4">
        <div className="inventory-header">
          <span className="tile-category">FULL OBJECT & FURNITURE INVENTORY (YOLO)</span>
          <span className="text-xs text-secondary font-mono">
            {detected_objects ? Object.values(detected_objects).reduce((a, b) => a + b, 0) : 0} total items identified
          </span>
        </div>

        {detected_objects && Object.keys(detected_objects).length > 0 ? (
          <div className="amenity-pills-wrap">
            {Object.entries(detected_objects).map(([name, count]) => (
              <div className="amenity-pill" key={name}>
                <span className="amenity-name">{name}</span>
                <span className="amenity-count">×{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state-text">No furniture or amenity classes detected in this image frame.</p>
        )}
      </div>
    </div>
  );
};



import React, { useState } from 'react';
import './App.css';
import { ImageUploader } from './components/ImageUploader';
import { AnalyzeResults } from './components/AnalyzeResults';
import { SeedIndexPanel } from './components/SeedIndexPanel';
import { ErrorBanner } from './components/ErrorBanner';
import { TrustEvaluationForm } from './components/TrustEvaluationForm';
import { HotelDiscoveryView } from './components/HotelDiscoveryView';
import { analyzeImages, AnalyzeListingResponse, HotelListing } from './lib/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hotel_discovery' | 'analysis'>('hotel_discovery');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzeListingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [submittedPrice, setSubmittedPrice] = useState<number | undefined>(undefined);
  const [preloadedHotel, setPreloadedHotel] = useState<HotelListing | null>(null);
  const [comparisonHotels, setComparisonHotels] = useState<HotelListing[]>([]);

  const handleCompareListings = (hotels: HotelListing[]) => {
    setComparisonHotels(hotels);
    if (hotels.length > 0) {
      setPreloadedHotel(hotels[0]);
    }
    setActiveTab('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async (formData?: any) => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setSubmittedPrice(formData?.price);

    try {
      const data = await analyzeImages(
        selectedFiles, 
        formData?.stars || 3, 
        formData?.description || '', 
        formData?.price || 0,
        formData?.foodIncluded || false,
        formData?.foodDescription || '',
        formData?.location || ''
      );
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      {/* Looping Ambient Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="ambient-bg-video" 
        src="/background.mp4" 
      />
      <div className="glacier-video-overlay" />

      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand-lockup">
            <span className="brand-symbol">◈</span>
            <span className="brand-name">LodgeTrust</span>
            <span className="brand-badge">Glacier Intelligence</span>
          </div>
          <div className="nav-status">
            <span className="status-indicator-dot" />
            <span className="status-label">Neural Engine Active</span>
          </div>
        </div>
      </nav>

      <div className="app-container">
        {/* Navigation Bar (Double-Bezel Glass Pill) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            padding: '6px',
            borderRadius: '20px',
            border: '1.5px solid rgba(255, 255, 255, 0.45)',
            display: 'flex',
            gap: '8px',
            boxShadow: '0 8px 32px -4px rgba(15, 35, 55, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.6)'
          }}>
            <button
              onClick={() => setActiveTab('analysis')}
              style={{
                background: activeTab === 'analysis' ? '#000000' : 'transparent',
                color: activeTab === 'analysis' ? '#FFFFFF' : '#000000',
                border: 'none',
                borderRadius: '14px',
                padding: '11px 26px',
                fontSize: '14px',
                fontWeight: 850,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: activeTab === 'analysis' ? '0 6px 18px rgba(0, 0, 0, 0.25)' : 'none'
              }}
            >
              <span>Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('hotel_discovery')}
              style={{
                background: activeTab === 'hotel_discovery' ? '#000000' : 'transparent',
                color: activeTab === 'hotel_discovery' ? '#FFFFFF' : '#000000',
                border: 'none',
                borderRadius: '14px',
                padding: '11px 26px',
                fontSize: '14px',
                fontWeight: 850,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: activeTab === 'hotel_discovery' ? '0 6px 18px rgba(0, 0, 0, 0.25)' : 'none'
              }}
            >
              <span>Hotel Discovery</span>
            </button>
          </div>
        </div>

        {activeTab === 'hotel_discovery' ? (
          <HotelDiscoveryView 
            onAuditListing={(hotel) => {
              setPreloadedHotel(hotel);
              setComparisonHotels([hotel]);
              setActiveTab('analysis');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompareListings={handleCompareListings}
          />
        ) : (
          <>
            {/* Multi-Hotel Comparison Bar in Image Analysis */}
            {comparisonHotels.length > 1 && (
              <div className="glass-outer-shell mb-4" style={{ marginBottom: '24px' }}>
                <div className="apple-card" style={{ 
                  padding: '18px 22px', 
                  background: 'rgba(255, 255, 255, 0.24)', 
                  border: '1.5px solid rgba(0, 113, 227, 0.35)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 850, color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Comparing {comparisonHotels.length} Properties in Multi-Listing Analysis
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                      Click a property to populate its parameters for visual audit & compliance verification:
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {comparisonHotels.map(h => {
                      const isSelected = preloadedHotel?.id === h.id;
                      return (
                        <button
                          key={h.id}
                          onClick={() => setPreloadedHotel(h)}
                          style={{
                            background: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.28)',
                            color: isSelected ? '#FFFFFF' : '#000000',
                            border: isSelected ? '1.5px solid #000000' : '1px solid rgba(255, 255, 255, 0.45)',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.3)' : 'var(--shadow-sm)',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          {isSelected && <span>✓ </span>}
                          <span>{h.name}</span>
                          {h.price_per_night > 0 && <span style={{ opacity: 0.9 }}>(₹{h.price_per_night.toLocaleString()})</span>}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setComparisonHotels([])}
                      style={{
                        background: 'transparent',
                        color: '#334155',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        padding: '6px 10px'
                      }}
                      title="Dismiss comparison bar"
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header Hero */}
            <header className="hero-header">
              <div className="eyebrow-pill">GLACIER MULTIMODAL INTELLIGENCE</div>
              <h1 className="hero-title">Visual Quality & Listing Verification</h1>
              <p className="hero-subtitle">
                Autonomous multi-signal verification evaluating fine-tuned aesthetic scores, natural lighting geometry, color harmony palettes, and YOLO amenity completeness.
              </p>
            </header>

            {/* Main Processing Area */}
            <main className="main-panel">
              {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

              <div style={{ display: 'flex', gap: '32px', alignItems: 'stretch', width: '100%', flexWrap: 'wrap' }}>
                
                {/* LEFT COLUMN: INPUT ASSETS (Glassmorphism Outer Shell + Inner Card) */}
                <div style={{ flex: '1 1 540px', minWidth: '420px', display: 'flex', flexDirection: 'column' }}>
                  <div className="glass-outer-shell input-glass-panel">
                    <div className="apple-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '28px' }}>
                      <div className="card-header-clean">
                        <div>
                          <div className="eyebrow-label">INPUT ASSETS</div>
                          <h3 className="section-title">Upload Room & Property Photos</h3>
                        </div>
                        <span style={{
                          background: 'rgba(0, 113, 227, 0.1)',
                          color: '#0071E3',
                          border: '1px solid rgba(0, 113, 227, 0.25)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} staged
                        </span>
                      </div>

                      <TrustEvaluationForm
                        selectedFiles={selectedFiles}
                        onFilesChange={setSelectedFiles}
                        onSubmit={handleAnalyze}
                        disabled={loading}
                        initialLocation={preloadedHotel ? `${preloadedHotel.name}, ${preloadedHotel.address}` : 'Chennai'}
                        initialDescription={preloadedHotel ? `Verified lodging listing for ${preloadedHotel.name} in ${preloadedHotel.city}.` : undefined}
                        initialStars={preloadedHotel?.star_rating || 3}
                        initialPrice={preloadedHotel && preloadedHotel.price_per_night > 0 ? preloadedHotel.price_per_night : ''}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: OUTPUT (Glassmorphism Outer Shell + Inner Card) */}
                <div style={{ flex: '1 1 540px', minWidth: '420px', display: 'flex', flexDirection: 'column' }}>
                  <div className="glass-outer-shell output-glass-panel">
                    {loading && (
                      <div className="apple-card loading-card" style={{ flex: 1, minHeight: '520px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '48px 32px' }}>
                        <div className="apple-spinner" style={{ marginBottom: '24px' }} />
                        <h3 className="loading-title" style={{ fontSize: '22px', fontWeight: 850, color: '#000000', marginBottom: '10px' }}>
                          Synthesizing Multimodal Signals
                        </h3>
                        <p className="loading-desc" style={{ color: '#1E293B', fontSize: '14.5px', fontWeight: 600, maxWidth: '460px', lineHeight: 1.65 }}>
                          Executing vision aesthetic scoring, YOLO amenity identification, regulatory RAG verification, and LLM pricing analysis...
                        </p>
                      </div>
                    )}

                    {results && !loading && (
                      <div className="apple-card" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '32px', boxSizing: 'border-box' }}>
                        {/* Header Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <div className="eyebrow-label" style={{ margin: 0, color: '#0071E3', fontWeight: 850, letterSpacing: '0.1em' }}>
                            TRUST EVALUATION AUDIT
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: 'rgba(5, 150, 105, 0.14)', 
                            border: '1.5px solid rgba(5, 150, 105, 0.4)',
                            padding: '5px 12px', 
                            borderRadius: '12px',
                            fontSize: '12.5px', 
                            color: '#065F46', 
                            fontWeight: 800
                          }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669' }} />
                            Audit Complete
                          </div>
                        </div>
                        
                        {results.trust_evaluation ? (
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            {/* Hero Trust Score Metric */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px', marginBottom: '8px' }}>
                              <div style={{ 
                                fontSize: '80px', 
                                fontWeight: 900, 
                                letterSpacing: '-0.04em', 
                                color: results.trust_evaluation.final_trust_percentage >= 70 ? '#059669' : results.trust_evaluation.final_trust_percentage >= 50 ? '#D97706' : '#DC2626', 
                                lineHeight: 1 
                              }}>
                                {results.trust_evaluation.final_trust_percentage}%
                              </div>
                              <div>
                                <div style={{ fontSize: '24px', fontWeight: 850, color: '#000000', letterSpacing: '-0.02em' }}>
                                  {results.trust_evaluation.final_trust_percentage >= 70 ? 'High Confidence Listing' : results.trust_evaluation.final_trust_percentage >= 50 ? 'Moderate Confidence' : 'Suspicious Listing Discrepancy'}
                                </div>
                                <div style={{ fontSize: '14px', color: '#1E293B', fontWeight: 650, marginTop: '3px' }}>
                                  Multimodal verification weighted across pricing, visual claims & regulations
                                </div>
                              </div>
                            </div>

                            {/* Score Breakdown Progress Bars */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', margin: '22px 0' }}>
                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 750, color: '#000000', marginBottom: '6px' }}>Price Plausibility</div>
                                <div style={{ fontSize: '22px', fontWeight: 850, color: '#059669' }}>
                                  {Math.round((results.trust_evaluation.price_plausibility_score || 0) * 100)}%
                                </div>
                              </div>
                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 750, color: '#000000', marginBottom: '6px' }}>Visual Match</div>
                                <div style={{ fontSize: '22px', fontWeight: 850, color: '#0071E3' }}>
                                  {Math.round((results.trust_evaluation.description_match_score || 0) * 100)}%
                                </div>
                              </div>
                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 750, color: '#000000', marginBottom: '6px' }}>Regulatory Met</div>
                                <div style={{ fontSize: '22px', fontWeight: 850, color: '#D97706' }}>
                                  {Math.round((results.compliance?.compliance_ratio || 0) * 100)}%
                                </div>
                              </div>
                            </div>

                            {/* Quick 4-Tile Intelligence Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI FAIR PRICE ESTIMATE</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
                                  ₹{(results.trust_evaluation.estimated_price || 0).toLocaleString()} <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>vs claimed ₹{(submittedPrice || 0).toLocaleString()}</span>
                                </div>
                              </div>

                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0071E3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>REGIONAL BENCHMARK</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
                                  {results.location_price ? `₹${results.location_price.min_price.toLocaleString()} – ₹${results.location_price.max_price.toLocaleString()}` : 'National Avg'}
                                </div>
                              </div>

                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.06em' }}>VISUAL AESTHETIC TIER</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
                                  {results.aggregated.style_tier || 'Standard'} • {results.aggregated.aesthetic_score?.toFixed(1) || '0'}/10 Score
                                </div>
                              </div>

                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.06em' }}>REGULATORY STANDARDS</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
                                  {results.compliance?.criteria_met || 0} of {results.compliance?.criteria_total || 0} Standards Met
                                </div>
                              </div>
                            </div>
                            
                            {/* LLM Strategic Analysis Callout Box (Expanded Presence) */}
                            <div style={{ 
                              flex: 1, 
                              display: 'flex', 
                              flexDirection: 'column', 
                              background: 'rgba(0, 113, 227, 0.10)', 
                              backdropFilter: 'blur(16px)',
                              border: '1.5px solid rgba(0, 113, 227, 0.35)', 
                              borderLeft: '6px solid #0071E3', 
                              padding: '26px 28px', 
                              borderRadius: '0 18px 18px 0',
                              minHeight: '220px',
                              boxShadow: 'var(--shadow-sm)'
                            }}>
                              <div style={{ fontSize: '12px', fontWeight: 850, color: '#0071E3', marginBottom: '10px', letterSpacing: '0.09em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>LLM STRATEGIC AUDIT VERDICT</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '16px', color: '#000000', fontWeight: 700, lineHeight: 1.75, overflowY: 'auto', flex: 1 }}>
                                {results.trust_evaluation.analysis_notes}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '72px', fontWeight: 900, letterSpacing: '-0.04em', color: '#059669', marginBottom: '8px', lineHeight: 1 }}>
                                {results.compliance?.compliance_ratio !== undefined ? Math.round(results.compliance.compliance_ratio * 100) + '%' : 'Pending%'}
                              </div>
                              <h3 style={{ fontSize: '22px', fontWeight: 850, color: '#000000', marginBottom: '18px' }}>
                                {results.compliance?.compliance_ratio !== undefined && results.compliance.compliance_ratio >= 0.7 ? 'High Compliance Adherence' : 'Review Recommended'}
                              </h3>
                              
                              <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-sm)', marginBottom: '18px' }}>
                                <p style={{ margin: '0 0 10px 0', fontSize: '14.5px', color: '#000000', fontWeight: 700 }}><strong>Vision Aesthetics:</strong> {results.aggregated.style_tier || 'Standard'} Tier • {results.aggregated.aesthetic_score?.toFixed(1)}/10 Aesthetic Score</p>
                                {results.location_price && (
                                  <p style={{ margin: '0 0 10px 0', fontSize: '14.5px', color: '#0071E3', fontWeight: 750 }}><strong>RAG Regional Benchmark ({results.location_price.location}):</strong> Expected ₹{results.location_price.min_price.toLocaleString()} – ₹{results.location_price.max_price.toLocaleString()} / night</p>
                                )}
                                <p style={{ margin: 0, fontSize: '14.5px', color: '#000000', fontWeight: 700 }}><strong>Compliance Standards:</strong> {results.compliance?.criteria_met || 0} of {results.compliance?.criteria_total || 0} required amenities verified for {results.compliance?.star_claimed || 3} stars.</p>
                              </div>
                            </div>

                            <div style={{ background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(12px)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.40)', color: '#000000', fontWeight: 700, fontSize: '13.5px' }}>
                              Provide description and price in the left form to activate LLM tariff arbitration.
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!results && !loading && !error && (
                      <div className="apple-card" style={{ flex: 1, minHeight: '520px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '2px dashed rgba(0, 113, 227, 0.35)', padding: '48px 32px' }}>
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '50%', 
                          background: 'rgba(0, 113, 227, 0.12)', 
                          border: '1.5px solid rgba(0, 113, 227, 0.3)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '24px', 
                          color: '#0071E3', 
                          marginBottom: '20px',
                          boxShadow: '0 8px 24px rgba(0, 113, 227, 0.15)'
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 850, color: '#000000', marginBottom: '10px' }}>
                          Multimodal Trust Evaluator
                        </h3>
                        <p style={{ color: '#1E293B', fontSize: '14.5px', fontWeight: 650, maxWidth: '380px', lineHeight: 1.6, marginBottom: '26px' }}>
                          Upload room photos and fill property claims on the left to execute automated visual, regulatory, and pricing verification.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px' }}>
                          <div style={{ background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.40)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 750, color: '#000000', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                            <span style={{ color: '#059669', fontSize: '16px' }}>✓</span>
                            <span>Computer Vision & YOLO Amenities</span>
                          </div>
                          <div style={{ background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.40)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 750, color: '#000000', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                            <span style={{ color: '#0071E3', fontSize: '16px' }}>✓</span>
                            <span>ChromaDB HRACC Compliance RAG</span>
                          </div>
                          <div style={{ background: 'rgba(255, 255, 255, 0.22)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.40)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 750, color: '#000000', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                            <span style={{ color: '#D97706', fontSize: '16px' }}>✓</span>
                            <span>Gemini LLM Tariff & Claim Analysis</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Results View - Full Breakdown Below */}
              {results && !loading && <AnalyzeResults data={results} claimedPrice={submittedPrice} />}

              {/* FAISS Index Management Panel */}
              <div className="mt-5" style={{ marginTop: '32px' }}>
                <SeedIndexPanel />
              </div>
            </main>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>LodgeTrust Core Architecture • Hotel & Vacation Rental Listing Verification</span>
          <span className="font-mono text-xs" style={{ color: '#000000', fontWeight: 800 }}>v2.0.0-glacier-gray</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

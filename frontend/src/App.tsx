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
  const [activeTab, setActiveTab] = useState<'phase2_discovery' | 'phase1_auditor'>('phase2_discovery');
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
    setActiveTab('phase1_auditor');
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
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand-lockup">
            <span className="brand-symbol">◈</span>
            <span className="brand-name">LodgeTrust</span>
            <span className="brand-badge">Module B</span>
          </div>
          <div className="nav-status">
            <span className="status-indicator-dot" />
            <span className="status-label">Fine-Tuned Neural Engine Online</span>
          </div>
        </div>
      </nav>

      <div className="app-container">
        {/* Phase Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{
            background: 'rgba(28, 28, 30, 0.8)',
            backdropFilter: 'blur(20px)',
            padding: '5px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '6px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <button
              onClick={() => setActiveTab('phase2_discovery')}
              style={{
                background: activeTab === 'phase2_discovery' ? '#0a84ff' : 'transparent',
                color: activeTab === 'phase2_discovery' ? '#ffffff' : '#8e8e93',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🗺️</span>
              <span>Phase 2: Hotel & Lodge Discovery (Mapbox)</span>
            </button>
            <button
              onClick={() => setActiveTab('phase1_auditor')}
              style={{
                background: activeTab === 'phase1_auditor' ? '#0a84ff' : 'transparent',
                color: activeTab === 'phase1_auditor' ? '#ffffff' : '#8e8e93',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🔍</span>
              <span>Phase 1: Listing Trust Auditor</span>
            </button>
          </div>
        </div>

        {activeTab === 'phase2_discovery' ? (
          <HotelDiscoveryView 
            onAuditListing={(hotel) => {
              setPreloadedHotel(hotel);
              setComparisonHotels([hotel]);
              setActiveTab('phase1_auditor');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompareListings={handleCompareListings}
          />
        ) : (
          <>
            {/* Multi-Hotel Comparison Bar in Phase 1 Image Analysis */}
            {comparisonHotels.length > 1 && (
              <div className="apple-card mb-4" style={{ 
                padding: '16px 20px', 
                borderRadius: '16px', 
                background: 'rgba(10, 132, 255, 0.08)', 
                border: '1px solid rgba(10, 132, 255, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0a84ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Comparing {comparisonHotels.length} Properties in Image Analysis Phase
                  </div>
                  <div style={{ fontSize: '13px', color: '#d2d2d7', marginTop: '2px' }}>
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
                          background: isSelected ? '#0a84ff' : 'rgba(255, 255, 255, 0.06)',
                          color: isSelected ? '#ffffff' : '#d2d2d7',
                          border: isSelected ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '10px',
                          padding: '7px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{isSelected ? '✓ ' : '🏨 '}</span>
                        <span>{h.name}</span>
                        {h.price_per_night > 0 && <span style={{ opacity: 0.8 }}>(₹{h.price_per_night.toLocaleString()})</span>}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setComparisonHotels([])}
                    style={{
                      background: 'transparent',
                      color: '#8e8e93',
                      border: 'none',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                    title="Dismiss comparison bar"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Header Hero */}
            <header className="hero-header">
              <div className="eyebrow-pill">MULTIMODAL IMAGE INTELLIGENCE</div>
              <h1 className="hero-title">Visual Quality & Listing Verification</h1>
              <p className="hero-subtitle">
                Autonomous multi-signal verification evaluating fine-tuned aesthetic scores, natural lighting geometry, color harmony palettes, and YOLO amenity completeness.
              </p>
            </header>

            {/* Main Processing Area */}
            <main className="main-panel">
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', width: '100%' }}>
            
            {/* LEFT COLUMN: INPUT */}
            <div style={{ flex: '1 1 50%', minWidth: '400px', display: 'flex', flexDirection: 'column' }}>
              <div className="apple-card uploader-card" style={{ marginBottom: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="card-header-clean">
                  <div>
                    <div className="eyebrow-label">INPUT ASSETS</div>
                    <h3 className="section-title">Upload Room & Property Photos</h3>
                  </div>
                  <span className="text-xs text-secondary font-mono">
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

            {/* RIGHT COLUMN: OUTPUT */}
            <div style={{ flex: '1 1 50%', minWidth: '400px', display: 'flex', flexDirection: 'column' }}>
              {loading && (
                <div className="apple-card loading-card" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '40px' }}>
                  <div className="apple-spinner" style={{ marginBottom: '20px' }} />
                  <h3 className="loading-title" style={{ fontSize: '20px', fontWeight: 600, color: '#f5f5f7', marginBottom: '10px' }}>
                    Synthesizing Multimodal Signals
                  </h3>
                  <p className="loading-desc" style={{ color: '#8e8e93', fontSize: '13px', maxWidth: '420px', lineHeight: 1.6 }}>
                    Querying fine-tuned vision aesthetic regressor, YOLO amenity detector, ChromaDB regulatory RAG, and Gemini LLM pricing analyst...
                  </p>
                </div>
              )}

              {results && !loading && (
                <div className="apple-card" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', padding: '28px', boxSizing: 'border-box' }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div className="eyebrow-label" style={{ margin: 0, color: '#0a84ff', fontWeight: 700, letterSpacing: '0.08em' }}>
                      MODULE E • TRUST EVALUATION AUDIT
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      background: 'rgba(52, 199, 89, 0.12)', 
                      border: '1px solid rgba(52, 199, 89, 0.3)',
                      padding: '4px 10px', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#34c759',
                      fontWeight: 600
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34c759' }} />
                      Audit Complete
                    </div>
                  </div>
                  
                  {results.trust_evaluation ? (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Hero Trust Score Metric */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '4px' }}>
                        <div style={{ 
                          fontSize: '68px', 
                          fontWeight: '800', 
                          letterSpacing: '-0.03em', 
                          color: results.trust_evaluation.final_trust_percentage >= 70 ? '#34c759' : results.trust_evaluation.final_trust_percentage >= 50 ? '#ff9f0a' : '#ff3b30', 
                          lineHeight: 1 
                        }}>
                          {results.trust_evaluation.final_trust_percentage}%
                        </div>
                        <div>
                          <div style={{ fontSize: '20px', fontWeight: 600, color: '#f5f5f7' }}>
                            {results.trust_evaluation.final_trust_percentage >= 70 ? 'High Confidence Listing' : results.trust_evaluation.final_trust_percentage >= 50 ? 'Moderate Confidence' : 'Suspicious Listing Discrepancy'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                            Multimodal verification weighted across pricing, visual claims & regulations
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown Progress Bars */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '20px 0' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '6px' }}>Price Plausibility</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#34c759' }}>
                            {Math.round((results.trust_evaluation.price_plausibility_score || 0) * 100)}%
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '6px' }}>Visual Match</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#0a84ff' }}>
                            {Math.round((results.trust_evaluation.description_match_score || 0) * 100)}%
                          </div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '6px' }}>HRACC RAG Met</div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#ff9f0a' }}>
                            {Math.round((results.compliance?.compliance_ratio || 0) * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* Quick 4-Tile Intelligence Summary */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93' }}>AI FAIR PRICE ESTIMATE</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f7', marginTop: '2px' }}>
                            ₹{results.trust_evaluation.estimated_price?.toLocaleString()} <span style={{ fontSize: '11px', color: '#8e8e93', fontWeight: 400 }}>vs claimed ₹{(submittedPrice || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93' }}>REGIONAL BENCHMARK</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0a84ff', marginTop: '2px' }}>
                            {results.location_price ? `₹${results.location_price.min_price.toLocaleString()} – ₹${results.location_price.max_price.toLocaleString()}` : 'National Avg'}
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93' }}>VISUAL AESTHETIC TIER</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f7', marginTop: '2px' }}>
                            {results.aggregated.style_tier || 'Standard'} • {results.aggregated.aesthetic_score?.toFixed(1) || '0'}/10 Score
                          </div>
                        </div>

                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '11px', color: '#8e8e93' }}>HRACC AMENITY STANDARDS</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f5f7', marginTop: '2px' }}>
                            {results.compliance?.criteria_met || 0} of {results.compliance?.criteria_total || 0} Standards Met
                          </div>
                        </div>
                      </div>
                      
                      {/* LLM Strategic Analysis Callout Box (Fills Remaining Space) */}
                      <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.12), rgba(10, 132, 255, 0.04))', 
                        border: '1px solid rgba(10, 132, 255, 0.25)', 
                        borderLeft: '4px solid #0a84ff', 
                        padding: '18px 20px', 
                        borderRadius: '0 14px 14px 0',
                        minHeight: '140px'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#0a84ff', marginBottom: '8px', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>◈</span>
                          <span>LLM STRATEGIC AUDIT VERDICT</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '14.5px', color: '#e5e5ea', lineHeight: 1.6, overflowY: 'auto', flex: 1 }}>
                          {results.trust_evaluation.analysis_notes}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '64px', fontWeight: '800', letterSpacing: '-0.03em', color: '#34c759', marginBottom: '6px', lineHeight: 1 }}>
                          {results.compliance?.compliance_ratio !== undefined ? Math.round(results.compliance.compliance_ratio * 100) + '%' : 'Pending%'}
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#f5f5f7', marginBottom: '16px' }}>
                          {results.compliance?.compliance_ratio !== undefined && results.compliance.compliance_ratio >= 0.7 ? 'High Compliance Adherence' : 'Review Recommended'}
                        </h3>
                        
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: '#d2d2d7' }}><strong>Module B Vision:</strong> {results.aggregated.style_tier || 'Standard'} Tier • {results.aggregated.aesthetic_score?.toFixed(1)}/10 Aesthetic Score</p>
                          {results.location_price && (
                            <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', color: '#0a84ff' }}><strong>RAG Regional Benchmark ({results.location_price.location}):</strong> Expected ₹{results.location_price.min_price.toLocaleString()} – ₹{results.location_price.max_price.toLocaleString()} / night</p>
                          )}
                          <p style={{ margin: 0, fontSize: '13.5px', color: '#d2d2d7' }}><strong>Module D Compliance:</strong> {results.compliance?.criteria_met || 0} of {results.compliance?.criteria_total || 0} required amenities verified for {results.compliance?.star_claimed || 3} stars.</p>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#8e8e93', fontSize: '13px' }}>
                        Provide description and price in the left form to activate Module E LLM tariff arbitration.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!results && !loading && !error && (
                <div className="apple-card" style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.15)', padding: '40px' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    background: 'rgba(10, 132, 255, 0.12)', 
                    border: '1px solid rgba(10, 132, 255, 0.25)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '24px', 
                    color: '#0a84ff', 
                    marginBottom: '18px' 
                  }}>
                    ◈
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 600, color: '#f5f5f7', marginBottom: '8px' }}>
                    Multimodal Trust Evaluator
                  </h3>
                  <p style={{ color: '#8e8e93', fontSize: '14px', maxWidth: '360px', lineHeight: 1.5, marginBottom: '24px' }}>
                    Upload room photos and fill property claims on the left to execute automated visual, regulatory, and pricing verification.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '320px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#34c759' }}>✓</span>
                      <span>Computer Vision & YOLO Amenities</span>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#0a84ff' }}>✓</span>
                      <span>ChromaDB HRACC Compliance RAG</span>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ff9f0a' }}>✓</span>
                      <span>Gemini LLM Tariff & Claim Analysis</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Results View - Full Breakdown Below */}
          {results && !loading && <AnalyzeResults data={results} claimedPrice={submittedPrice} />}

          {/* FAISS Index Management Panel */}
          <div className="mt-5">
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
          <span className="font-mono text-xs">v1.2.0-monochrome</span>
        </div>
      </footer>
    </div>
  );
};

export default App;


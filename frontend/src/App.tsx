import React, { useState } from 'react';
import './App.css';
import { ImageUploader } from './components/ImageUploader';
import { AnalyzeResults } from './components/AnalyzeResults';
import { SeedIndexPanel } from './components/SeedIndexPanel';
import { ErrorBanner } from './components/ErrorBanner';
import { TrustEvaluationForm } from './components/TrustEvaluationForm';
import { analyzeImages, AnalyzeListingResponse } from './lib/api';

export const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzeListingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (formData?: any) => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeImages(
        selectedFiles, 
        formData?.stars || 3, 
        formData?.description || '', 
        formData?.price || 0,
        formData?.foodIncluded || false,
        formData?.foodDescription || ''
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
          
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
            
            {/* LEFT COLUMN: INPUT */}
            <div style={{ flex: '1 1 50%', minWidth: '400px' }}>
              <div className="apple-card uploader-card" style={{ marginBottom: 0 }}>
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
                />
              </div>
            </div>

            {/* RIGHT COLUMN: OUTPUT */}
            <div style={{ flex: '1 1 50%', minWidth: '400px', display: 'flex', flexDirection: 'column' }}>
              {loading && (
                <div className="apple-card loading-card" style={{ flex: 1 }}>
                  <div className="apple-spinner" />
                  <h3 className="loading-title">Synthesizing Multimodal Signals</h3>
                  <p className="loading-desc">
                    Executing fine-tuned vision aesthetic regressor, CIELAB lighting exposure analysis, K-Means color harmony clustering, and YOLO amenity detection.
                  </p>
                </div>
              )}

              {results && !loading && (
                <div className="apple-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px' }}>
                  <div className="eyebrow-label" style={{ marginBottom: '16px' }}>TRUST EVALUATION SCORE</div>
                  
                  {results.trust_evaluation ? (
                    <>
                      <div style={{ fontSize: '72px', fontWeight: '800', letterSpacing: '-0.03em', color: results.trust_evaluation.final_trust_percentage > 70 ? '#34c759' : '#ff3b30', marginBottom: '8px', lineHeight: 1 }}>
                        {results.trust_evaluation.final_trust_percentage}%
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#f5f5f7', marginBottom: '32px' }}>
                        {results.trust_evaluation.final_trust_percentage > 70 ? 'High Confidence Listing' : 'Suspicious Listing'}
                      </h3>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#d2d2d7' }}><strong>Module B (Vision):</strong> {results.aggregated.style_tier || 'Unknown'} Tier • {results.aggregated.aesthetic_score?.toFixed(1)}/10 Aesthetic Score</p>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#d2d2d7' }}><strong>Module D (Compliance):</strong> {results.compliance?.criteria_met || 0} of {results.compliance?.criteria_total || 0} required amenities verified.</p>
                          <p style={{ margin: 0, fontSize: '15px', color: '#f5f5f7', fontWeight: 600 }}><strong>Module E (LLM):</strong> Estimated Price: ₹{results.trust_evaluation.estimated_price}</p>
                        </div>
                        
                        <div style={{ background: 'rgba(10, 132, 255, 0.1)', borderLeft: '4px solid #0a84ff', padding: '20px', borderRadius: '0 12px 12px 0', marginTop: 'auto' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a84ff', marginBottom: '8px', letterSpacing: '0.05em' }}>LLM VERDICT</div>
                          <p style={{ margin: 0, fontSize: '16px', color: '#e5e5ea', lineHeight: 1.5, fontStyle: 'normal' }}>
                            {results.trust_evaluation.analysis_notes}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '72px', fontWeight: '800', letterSpacing: '-0.03em', color: '#34c759', marginBottom: '8px', lineHeight: 1 }}>
                        {results.compliance?.compliance_ratio !== undefined ? Math.round(results.compliance.compliance_ratio * 100) + '%' : 'Pending%'}
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#f5f5f7', marginBottom: '32px' }}>
                        {results.compliance?.compliance_ratio !== undefined && results.compliance.compliance_ratio > 0.7 ? 'High Confidence' : 'Review Required'}
                      </h3>
                      
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#d2d2d7' }}><strong>Module B Analysis:</strong> {results.aggregated.style_tier || 'Unknown'} Tier • {results.aggregated.aesthetic_score?.toFixed(1)}/10 Aesthetic Score</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#d2d2d7' }}><strong>Module D Compliance:</strong> {results.compliance?.criteria_met || 0} of {results.compliance?.criteria_total || 0} required amenities verified for {results.compliance?.star_claimed || 3} stars.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!results && !loading && !error && (
                <div className="apple-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed #424245' }}>
                  <p style={{ color: '#86868b', fontSize: '15px' }}>Fill out the form and upload an image to see the trust evaluation results here.</p>
                </div>
              )}
            </div>

          </div>

          {/* Results View - Full Breakdown Below */}
          {results && !loading && <AnalyzeResults data={results} />}

          {/* FAISS Index Management Panel */}
          <div className="mt-5">
            <SeedIndexPanel />
          </div>
        </main>
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


import React, { useState } from 'react';
import './App.css';
import { ImageUploader } from './components/ImageUploader';
import { AnalyzeResults } from './components/AnalyzeResults';
import { SeedIndexPanel } from './components/SeedIndexPanel';
import { ErrorBanner } from './components/ErrorBanner';
import { analyzeImages, AnalyzeListingResponse } from './lib/api';

export const App: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzeListingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeImages(selectedFiles);
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
          <div className="apple-card uploader-card">
            <div className="card-header-clean">
              <div>
                <div className="eyebrow-label">INPUT ASSETS</div>
                <h3 className="section-title">Upload Room & Property Photos</h3>
              </div>
              <span className="text-xs text-secondary font-mono">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} staged
              </span>
            </div>

            <ImageUploader
              selectedFiles={selectedFiles}
              onFilesChange={setSelectedFiles}
              disabled={loading}
            />

            <div className="action-bar-clean mt-4">
              <button
                className="btn-apple-primary"
                onClick={handleAnalyze}
                disabled={loading || selectedFiles.length === 0}
              >
                {loading ? (
                  <>
                    <span className="apple-spinner-sm" />
                    <span>Processing Neural Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Evaluate Signals</span>
                    {selectedFiles.length > 0 && (
                      <span className="btn-count-pill">{selectedFiles.length}</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Animation */}
          {loading && (
            <div className="apple-card loading-card mt-4">
              <div className="apple-spinner" />
              <h3 className="loading-title">Synthesizing Multimodal Signals</h3>
              <p className="loading-desc">
                Executing fine-tuned vision aesthetic regressor, CIELAB lighting exposure analysis, K-Means color harmony clustering, and YOLO amenity detection.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4">
              <ErrorBanner
                message="Analysis execution failed"
                errors={[error]}
                onRetry={handleAnalyze}
                onDismiss={() => setError(null)}
              />
            </div>
          )}

          {/* Results View */}
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


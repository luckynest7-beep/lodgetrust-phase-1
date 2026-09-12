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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-badge">
          <span>🏨 LodgeTrust Verification Module B</span>
        </div>
        <h1 className="app-title">Image Analysis & Signal Extraction</h1>
        <p className="app-subtitle">
          Independent multi-signal analysis for hotel and lodge listing photos. Detects stolen photos (FAISS CLIP), synthetic AI images (SigLIP2), and extracts quality, style & amenity feature vectors.
        </p>
      </header>

      {/* Main Analysis Card */}
      <main className="card main-card">
        <ImageUploader
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
          disabled={loading}
        />

        <div className="action-bar">
          <button
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading || selectedFiles.length === 0}
          >
            {loading ? 'Analyzing Listing Images...' : `Analyze ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} Image${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-box mt-4">
            <div className="spinner" />
            <h3 className="font-semibold">Processing Image Analysis Pipeline...</h3>
            <p className="text-sm text-muted mt-1">
              Evaluating CLIP near-duplicate search, SigLIP2 AI classification, and YOLOv8 amenity detection. This may take ~15–30 seconds.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mt-4">
            <ErrorBanner
              message="Failed to complete image analysis request"
              errors={[error]}
              onRetry={handleAnalyze}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Results Section */}
        {results && !loading && <AnalyzeResults data={results} />}
      </main>

      {/* FAISS Index Management Panel */}
      <SeedIndexPanel />
    </div>
  );
};

export default App;

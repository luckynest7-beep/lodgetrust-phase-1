import React, { useState } from 'react';
import { addStolenImage, resetStolenIndex } from '../lib/api';

interface SeedIndexPanelProps {
  onIndexUpdated?: () => void;
}

export const SeedIndexPanel: React.FC<SeedIndexPanelProps> = ({ onIndexUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [listingId, setListingId] = useState('');
  const [imageId, setImageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !listingId.trim() || !imageId.trim()) {
      setError('Please select an image file and enter both Listing ID and Image ID.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await addStolenImage(file, listingId.trim(), imageId.trim());
      setMessage(`Successfully added image "${res.image_id}" under listing "${res.listing_id}" to FAISS index!`);
      setFile(null);
      setListingId('');
      setImageId('');
      if (onIndexUpdated) onIndexUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to add image to index.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetIndex = async () => {
    if (!window.confirm('Reset FAISS index and restore default demo images?')) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await resetStolenIndex();
      setMessage(res.message);
      if (onIndexUpdated) onIndexUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to reset FAISS index.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apple-card" style={{ marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.24)', border: '1px solid rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(20px)' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 850, color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
          </svg>
          FAISS Stolen Index Manager (Seed / Reset Database)
        </span>
        <span style={{ fontSize: '12px', color: '#000000', fontWeight: 850 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 18px 18px 18px', borderTop: '1px solid rgba(15, 23, 42, 0.08)', marginTop: '8px', paddingTop: '16px' }}>
          <p style={{ fontSize: '13px', color: '#0F172A', fontWeight: 650, margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Add images under custom Listing IDs to test B1 near-duplicate stolen photo detection end-to-end.
          </p>

          {message && <div className="alert-success-box" style={{ fontWeight: 750, color: '#15803d', marginBottom: '12px' }}>{message}</div>}
          {error && <div className="validation-error" style={{ fontWeight: 750, color: '#b91c1c', marginBottom: '12px' }}>{error}</div>}

          <form onSubmit={handleAddImage} className="seed-form">
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="seed-file" style={{ display: 'block', fontSize: '12px', fontWeight: 850, color: '#000000', marginBottom: '4px' }}>Image File</label>
              <input
                id="seed-file"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
                className="input-field"
                style={{ background: 'rgba(255, 255, 255, 0.20)', border: '1.5px solid rgba(255, 255, 255, 0.40)', color: '#000000', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label htmlFor="seed-listing" style={{ display: 'block', fontSize: '12px', fontWeight: 850, color: '#000000', marginBottom: '4px' }}>Listing ID</label>
                <input
                  id="seed-listing"
                  type="text"
                  placeholder="e.g. L_my_test"
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  disabled={loading}
                  className="input-field"
                  style={{ background: 'rgba(255, 255, 255, 0.20)', border: '1.5px solid rgba(255, 255, 255, 0.40)', color: '#000000', fontWeight: 750 }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="seed-image-id" style={{ display: 'block', fontSize: '12px', fontWeight: 850, color: '#000000', marginBottom: '4px' }}>Image ID</label>
                <input
                  id="seed-image-id"
                  type="text"
                  placeholder="e.g. img_001"
                  value={imageId}
                  onChange={(e) => setImageId(e.target.value)}
                  disabled={loading}
                  className="input-field"
                  style={{ background: 'rgba(255, 255, 255, 0.20)', border: '1.5px solid rgba(255, 255, 255, 0.40)', color: '#000000', fontWeight: 750 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !file || !listingId.trim() || !imageId.trim()}
                style={{ fontWeight: 800, padding: '8px 16px' }}
              >
                {loading ? 'Adding to Index...' : 'Add Image to Index'}
              </button>

              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={handleResetIndex}
                disabled={loading}
                style={{ fontWeight: 800, padding: '8px 16px' }}
              >
                Reset & Re-Seed Default Index
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

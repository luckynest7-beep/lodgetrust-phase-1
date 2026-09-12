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
    <div className="card collapsible-panel">
      <button
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="collapsible-title">
          <span className="icon">🛠️</span> FAISS Index Manager (Seed / Reset Index)
        </span>
        <span className="collapsible-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="collapsible-content">
          <p className="text-sm text-muted">
            Add images under custom Listing IDs to test B1 near-duplicate stolen photo detection end-to-end.
          </p>

          {message && <div className="alert-success-box">✅ {message}</div>}
          {error && <div className="validation-error">⚠️ {error}</div>}

          <form onSubmit={handleAddImage} className="seed-form">
            <div className="form-group">
              <label htmlFor="seed-file">Image File</label>
              <input
                id="seed-file"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="seed-listing">Listing ID</label>
                <input
                  id="seed-listing"
                  type="text"
                  placeholder="e.g. L_my_test"
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="seed-image-id">Image ID</label>
                <input
                  id="seed-image-id"
                  type="text"
                  placeholder="e.g. img_001"
                  value={imageId}
                  onChange={(e) => setImageId(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !file || !listingId.trim() || !imageId.trim()}
              >
                {loading ? 'Adding to Index...' : 'Add Image to Index'}
              </button>

              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={handleResetIndex}
                disabled={loading}
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

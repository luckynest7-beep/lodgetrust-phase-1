import React, { useState } from 'react';

export const TrustEvaluationForm: React.FC<{
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onSubmit: (formData: any) => void;
  disabled: boolean;
}> = ({ selectedFiles, onFilesChange, onSubmit, disabled }) => {
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [foodIncluded, setFoodIncluded] = useState(false);
  const [foodDescription, setFoodDescription] = useState('');
  const [stars, setStars] = useState<number>(3);

  const handleSubmit = () => {
    onSubmit({
      description,
      price: price === '' ? 0 : price,
      foodIncluded,
      foodDescription,
      stars
    });
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesChange(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="trust-evaluation-form" style={{ color: '#f5f5f7' }}>
      {/* 1. Image Upload Box */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '12px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>1. ROOM IMAGE</label>
        <div 
          className="upload-dropzone"
          style={{ 
            padding: '40px', 
            border: '1px dashed #424245', 
            borderRadius: '12px', 
            textAlign: 'center', 
            cursor: 'pointer',
            backgroundColor: '#1c1c1e',
            transition: 'all 0.2s ease'
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {selectedFiles.length > 0 ? (
            <div style={{ position: 'relative', width: '100%', maxHeight: '250px', overflow: 'hidden', borderRadius: '8px' }}>
              <img 
                src={URL.createObjectURL(selectedFiles[0])} 
                alt="Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: '#86868b' }}>Drag and drop photo here, or click to browse</p>
          )}
          <input 
            id="file-upload" 
            type="file" 
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) onFilesChange(Array.from(e.target.files));
            }}
          />
        </div>
      </div>

      {/* 2. Description Box */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '12px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>2. LISTING DESCRIPTION</label>
        <textarea 
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #424245',
            backgroundColor: '#1c1c1e', color: '#f5f5f7', fontSize: '15px', resize: 'vertical',
            outline: 'none', transition: 'border-color 0.2s ease'
          }}
          rows={4}
          placeholder="e.g. A pristine and well-lit modern 4-star hotel room..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        {/* 3. Price Input */}
        <div className="form-group" style={{ flex: 1 }}>
          <label className="eyebrow-label" style={{ display: 'block', marginBottom: '12px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>3. PRICE PER DAY (INR)</label>
          <input 
            type="number" 
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #424245',
              backgroundColor: '#1c1c1e', color: '#f5f5f7', fontSize: '15px', outline: 'none'
            }}
            placeholder="e.g. 5000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || '')}
            disabled={disabled}
          />
        </div>

        {/* Claimed Stars */}
        <div className="form-group" style={{ flex: 1 }}>
          <label className="eyebrow-label" style={{ display: 'block', marginBottom: '12px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>CLAIMED STARS</label>
          <select 
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #424245',
              backgroundColor: '#1c1c1e', color: '#f5f5f7', fontSize: '15px', outline: 'none',
              appearance: 'none', WebkitAppearance: 'none'
            }}
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            disabled={disabled}
          >
            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
          </select>
        </div>
      </div>

      {/* 4. Food Included Radio Button */}
      <div className="form-group" style={{ marginBottom: '32px', padding: '20px', borderRadius: '12px', backgroundColor: '#1c1c1e', border: '1px solid #424245' }}>
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '16px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>4. DINING OPTIONS</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: foodIncluded ? '16px' : '0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#d2d2d7' }}>
            <input 
              type="radio" 
              name="food" 
              checked={!foodIncluded} 
              onChange={() => setFoodIncluded(false)} 
              disabled={disabled}
              style={{ accentColor: '#0a84ff', width: '16px', height: '16px' }}
            />
            No Food Included
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#d2d2d7' }}>
            <input 
              type="radio" 
              name="food" 
              checked={foodIncluded} 
              onChange={() => setFoodIncluded(true)} 
              disabled={disabled}
              style={{ accentColor: '#0a84ff', width: '16px', height: '16px' }}
            />
            Food Included
          </label>
        </div>

        {/* Conditional Food Description */}
        {foodIncluded && (
          <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#86868b' }}>Describe the included food/meal plan:</label>
            <textarea 
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #424245',
                backgroundColor: '#000000', color: '#f5f5f7', fontSize: '14px', resize: 'vertical',
                outline: 'none'
              }}
              rows={2}
              placeholder="e.g. Complimentary continental breakfast buffet..."
              value={foodDescription}
              onChange={(e) => setFoodDescription(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button 
        className="btn-apple-primary"
        style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600 }}
        onClick={handleSubmit}
        disabled={disabled || selectedFiles.length === 0}
      >
        {disabled ? 'Evaluating Trust Signals...' : 'Evaluate Listing Trust'}
      </button>
    </div>
  );
};

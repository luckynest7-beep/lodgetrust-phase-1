import React, { useState, useEffect } from 'react';
import { HotelMap, HotelSearchResult } from './HotelMap';
import { getCities, CityInfo } from '../lib/api';

interface TrustEvaluationFormProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  onSubmit: (formData: any) => void;
  disabled: boolean;
  initialLocation?: string;
  initialDescription?: string;
  initialStars?: number;
  initialPrice?: number | '';
}

export const TrustEvaluationForm: React.FC<TrustEvaluationFormProps> = ({ 
  selectedFiles, 
  onFilesChange, 
  onSubmit, 
  disabled,
  initialLocation,
  initialDescription,
  initialStars,
  initialPrice
}) => {
  const [location, setLocation] = useState(initialLocation || 'Chennai');
  const [showMap, setShowMap] = useState(false);
  const [description, setDescription] = useState(initialDescription || '');
  const [price, setPrice] = useState<number | ''>(initialPrice !== undefined ? initialPrice : '');
  const [foodIncluded, setFoodIncluded] = useState(false);
  const [foodDescription, setFoodDescription] = useState('');
  const [stars, setStars] = useState<number>(initialStars || 3);
  const [cities, setCities] = useState<CityInfo[]>([]);

  // Fetch supported cities from backend
  useEffect(() => {
    getCities().then(data => {
      if (data && data.length > 0) setCities(data);
    }).catch(() => {});
  }, []);

  // Sync when initial values change (e.g. user selects a hotel from Phase 2 discovery)
  useEffect(() => {
    if (initialLocation) setLocation(initialLocation);
    if (initialDescription) setDescription(initialDescription);
    if (initialStars) setStars(initialStars);
    if (initialPrice !== undefined) setPrice(initialPrice);
  }, [initialLocation, initialDescription, initialStars, initialPrice]);

  const popularLocations = cities.length > 0
    ? cities.map(c => c.city)
    : ['Chennai', 'Goa', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Shimla', 'Jaipur', 'Ooty'];

  const getCoordinatesForLocation = (loc: string): [number, number] => {
    const matched = cities.find(c => loc.toLowerCase().includes(c.city.toLowerCase()));
    if (matched && matched.coordinates && Array.isArray(matched.coordinates) && matched.coordinates.length >= 2) {
      return matched.coordinates;
    }
    return [80.2493, 13.0584]; // Default to Chennai center
  };

  const handleSelectHotel = (hotel: HotelSearchResult) => {
    setLocation(hotel.name + ', ' + hotel.address);
    if (!description) {
      setDescription(`Verified lodging listing for ${hotel.name}.`);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      location,
      description,
      price: price === '' ? 0 : price,
      foodIncluded,
      foodDescription,
      stars
    });
  };

  const handleAddFiles = (newFiles: FileList | File[]) => {
    const incoming = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    if (incoming.length === 0) return;
    
    // Deduplicate against already selected files
    const existingKeys = new Set(selectedFiles.map(f => `${f.name}-${f.size}`));
    const unique = incoming.filter(f => !existingKeys.has(`${f.name}-${f.size}`));
    onFilesChange([...selectedFiles, ...unique]);
  };

  const handleRemoveFile = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = selectedFiles.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFilesChange([]);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="trust-evaluation-form" style={{ color: '#f5f5f7' }}>
      {/* 1. Image Upload Box */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label className="eyebrow-label" style={{ fontSize: '11px', letterSpacing: '1px', color: '#86868b', margin: 0 }}>
            1. ROOM & PROPERTY IMAGES ({selectedFiles.length} {selectedFiles.length === 1 ? 'PHOTO' : 'PHOTOS'})
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#0a84ff', fontWeight: 600, background: 'rgba(10, 132, 255, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
              Multi-Image Enabled
            </span>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  color: '#ff453a',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {selectedFiles.length === 0 ? (
          <div 
            className="upload-dropzone"
            style={{ 
              padding: '44px 24px', 
              border: '2px dashed rgba(255, 255, 255, 0.15)', 
              borderRadius: '16px', 
              textAlign: 'center', 
              cursor: 'pointer',
              backgroundColor: '#1c1c1e',
              transition: 'all 0.2s ease'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📸</div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#f5f5f7', margin: '0 0 6px 0' }}>
              Drag and drop multiple room photos here, or click to browse
            </p>
            <p style={{ fontSize: '12px', color: '#86868b', margin: 0 }}>
              Supports multiple PNG, JPG, WEBP • Upload bedrooms, washrooms, amenities & balcony views
            </p>
          </div>
        ) : (
          <div style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '16px'
          }}>
            {/* Multi-Image Gallery Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '12px',
              marginBottom: '14px'
            }}>
              {selectedFiles.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div 
                    key={`${file.name}-${file.size}-${idx}`}
                    style={{
                      position: 'relative',
                      height: '110px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#2c2c2e',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    <img 
                      src={objectUrl} 
                      alt={file.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    
                    {/* Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(0,0,0,0.65)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      #{idx + 1}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile(idx, e)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'rgba(255, 59, 48, 0.9)',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                      }}
                      title="Remove this photo"
                    >
                      ✕
                    </button>

                    {/* Filename caption */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      insetInline: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                      padding: '8px 6px 4px 6px',
                      fontSize: '10px',
                      color: '#d2d2d7',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {file.name}
                    </div>
                  </div>
                );
              })}

              {/* Add more button tile in the grid */}
              <div
                onClick={() => document.getElementById('file-upload')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                style={{
                  height: '110px',
                  borderRadius: '10px',
                  border: '1px dashed #0a84ff',
                  background: 'rgba(10, 132, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  padding: '8px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '20px', color: '#0a84ff', marginBottom: '2px' }}>+</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0a84ff' }}>Add Photos</span>
                <span style={{ fontSize: '9px', color: '#8e8e93', marginTop: '2px' }}>Click or drop</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#86868b', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span>Total: {selectedFiles.length} images staged for audit</span>
              <button
                type="button"
                onClick={() => document.getElementById('file-upload')?.click()}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Browse More
              </button>
            </div>
          </div>
        )}

        {/* Hidden Input with 'multiple' enabled */}
        <input 
          id="file-upload" 
          type="file" 
          multiple
          style={{ display: 'none' }}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* 2. Location Box */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label className="eyebrow-label" style={{ fontSize: '11px', letterSpacing: '1px', color: '#86868b', margin: 0 }}>
            2. PROPERTY LOCATION (RAG BENCHMARK)
          </label>
          <span style={{ fontSize: '11px', color: '#0a84ff', fontWeight: 600 }}>Vector Indexed</span>
        </div>
        <input 
          type="text"
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #424245',
            backgroundColor: '#1c1c1e', color: '#f5f5f7', fontSize: '15px', outline: 'none',
            marginBottom: '10px'
          }}
          placeholder="e.g. Goa, Baga Beach or Mumbai, BKC or Shimla Mall Road"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={disabled}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {popularLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocation(loc)}
              style={{
                background: location.toLowerCase().includes(loc.toLowerCase()) ? 'rgba(10, 132, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: location.toLowerCase().includes(loc.toLowerCase()) ? '#0a84ff' : '#a1a1a6',
                border: location.toLowerCase().includes(loc.toLowerCase()) ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Map Explorer Toggle & Component */}
        <div style={{ marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            style={{
              background: showMap ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: showMap ? '#0a84ff' : '#d2d2d7',
              border: showMap ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              marginBottom: showMap ? '14px' : '0'
            }}
          >
            <span>🗺️</span>
            <span>{showMap ? 'Hide Mapbox Hotel Explorer' : 'Explore Nearby Hotels on Mapbox'}</span>
          </button>

          {showMap && (
            <div style={{ marginTop: '12px' }}>
              <HotelMap
                initialCenter={getCoordinatesForLocation(location)}
                initialZoom={10}
                height="380px"
                onSelectHotel={handleSelectHotel}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Description Box */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '12px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>3. LISTING DESCRIPTION</label>
        <textarea 
          style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #424245',
            backgroundColor: '#1c1c1e', color: '#f5f5f7', fontSize: '15px', resize: 'vertical',
            outline: 'none', transition: 'border-color 0.2s ease'
          }}
          rows={3}
          placeholder="e.g. A pristine and well-lit modern hotel room with ocean view..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        {/* 4. Price Input */}
        <div className="form-group" style={{ flex: 1 }}>
          <label className="eyebrow-label" style={{ display: 'block', marginBottom: '12px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>4. CLAIMED PRICE PER NIGHT (INR)</label>
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

      {/* 5. Food Included Radio Button */}
      <div className="form-group" style={{ marginBottom: '32px', padding: '20px', borderRadius: '12px', backgroundColor: '#1c1c1e', border: '1px solid #424245' }}>
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '16px', fontSize: '11px', letterSpacing: '1px', color: '#86868b' }}>5. DINING OPTIONS</label>
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

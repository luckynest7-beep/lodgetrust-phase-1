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
    <div className="trust-evaluation-form" style={{ color: '#000000' }}>
      {/* 1. Image Upload Box */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label className="eyebrow-label" style={{ fontSize: '11.5px', letterSpacing: '0.08em', color: '#000000', fontWeight: 850, margin: 0 }}>
            1. ROOM & PROPERTY IMAGES ({selectedFiles.length} {selectedFiles.length === 1 ? 'PHOTO' : 'PHOTOS'})
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#0071E3', fontWeight: 800, background: 'rgba(0, 113, 227, 0.1)', border: '1px solid rgba(0, 113, 227, 0.25)', padding: '2px 8px', borderRadius: '6px' }}>
              Multi-Image Enabled
            </span>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  color: '#DC2626',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 800,
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
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            style={{ padding: '3.5rem 1.75rem' }}
          >
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '50%', 
              background: 'rgba(0, 113, 227, 0.12)', 
              color: '#0071E3', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 14px auto',
              border: '1.5px solid rgba(0, 113, 227, 0.25)' 
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            </div>
            <p className="dropzone-text" style={{ fontSize: '16.5px', fontWeight: 850, color: '#000000', margin: '0 0 6px 0' }}>
              Drag and drop multiple room photos here, or click to browse
            </p>
            <p className="dropzone-hint" style={{ fontSize: '13.5px', color: '#1E293B', fontWeight: 650, margin: 0 }}>
              Supports multiple PNG, JPG, WEBP • Upload bedrooms, washrooms, amenities & balcony views
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.20)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255, 255, 255, 0.42)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Multi-Image Gallery Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
              gap: '14px',
              marginBottom: '14px'
            }}>
              {selectedFiles.map((file, idx) => {
                const objectUrl = URL.createObjectURL(file);
                return (
                  <div 
                    key={`${file.name}-${file.size}-${idx}`}
                    style={{
                      position: 'relative',
                      height: '130px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.25)',
                      border: '1.5px solid rgba(148, 175, 198, 0.4)',
                      boxShadow: '0 4px 12px rgba(15, 30, 50, 0.08)'
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
                      background: 'rgba(0, 0, 0, 0.8)',
                      backdropFilter: 'blur(8px)',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '5px'
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
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        border: '1.5px solid #FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 900,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
                      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.85))',
                      padding: '8px 6px 4px 6px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#FFFFFF',
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
                  borderRadius: '12px',
                  border: '2px dashed #0071E3',
                  background: 'rgba(0, 113, 227, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  padding: '8px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#0071E3', marginBottom: '2px' }}>+</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0071E3' }}>Add Photos</span>
                <span style={{ fontSize: '10px', fontWeight: 650, color: '#334155', marginTop: '2px' }}>Click or drop</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', fontWeight: 750, color: '#000000', paddingTop: '10px', borderTop: '1px solid rgba(148, 175, 198, 0.3)' }}>
              <span>Total: {selectedFiles.length} images staged for audit</span>
              <button
                type="button"
                onClick={() => document.getElementById('file-upload')?.click()}
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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
          <label className="eyebrow-label" style={{ fontSize: '11.5px', letterSpacing: '0.08em', color: '#000000', fontWeight: 850, margin: 0 }}>
            2. PROPERTY LOCATION (RAG BENCHMARK)
          </label>
          <span style={{ fontSize: '11px', color: '#0071E3', fontWeight: 800, background: 'rgba(0, 113, 227, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>Vector Indexed</span>
        </div>
        <input 
          type="text"
          placeholder="e.g. Goa, Baga Beach or Mumbai, BKC or Shimla Mall Road"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={disabled}
          style={{ marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {popularLocations.map((loc) => {
            const isSelected = location.toLowerCase().includes(loc.toLowerCase());
            return (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                style={{
                  background: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.28)',
                  backdropFilter: 'blur(16px)',
                  color: isSelected ? '#FFFFFF' : '#000000',
                  border: isSelected ? '1.5px solid #000000' : '1px solid rgba(255, 255, 255, 0.45)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.25)' : 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Map Explorer Toggle & Component */}
        <div style={{ marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            style={{
              background: showMap ? 'rgba(0, 113, 227, 0.2)' : 'rgba(255, 255, 255, 0.28)',
              backdropFilter: 'blur(16px)',
              color: showMap ? '#0071E3' : '#000000',
              border: showMap ? '1.5px solid #0071E3' : '1px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '12px',
              padding: '9px 16px',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
              marginBottom: showMap ? '14px' : '0'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>{showMap ? 'Hide Mapbox Hotel Explorer' : 'Explore Nearby Hotels on Mapbox'}</span>
          </button>

          {showMap && (
            <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid rgba(255, 255, 255, 0.45)', boxShadow: 'var(--shadow-sm)' }}>
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
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '10px', fontSize: '11.5px', letterSpacing: '0.08em', color: '#000000', fontWeight: 850 }}>
          3. LISTING DESCRIPTION
        </label>
        <textarea 
          rows={5}
          placeholder="e.g. A pristine and well-lit modern hotel room with ocean view, free WiFi, air conditioning, and king bed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* 4. Price Input */}
        <div className="form-group" style={{ flex: '1 1 200px' }}>
          <label className="eyebrow-label" style={{ display: 'block', marginBottom: '10px', fontSize: '11.5px', letterSpacing: '0.08em', color: '#000000', fontWeight: 850 }}>
            4. CLAIMED PRICE PER NIGHT (INR)
          </label>
          <input 
            type="number" 
            placeholder="e.g. 5000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || '')}
            disabled={disabled}
          />
        </div>

        {/* Claimed Stars */}
        <div className="form-group" style={{ flex: '1 1 200px' }}>
          <label className="eyebrow-label" style={{ display: 'block', marginBottom: '10px', fontSize: '11.5px', letterSpacing: '0.08em', color: '#000000', fontWeight: 850 }}>
            CLAIMED STARS
          </label>
          <select 
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            disabled={disabled}
          >
            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
          </select>
        </div>
      </div>

      {/* 5. Food Included Radio Button (Frosted Glass Card) */}
      <div className="form-group" style={{ 
        marginBottom: '32px', 
        padding: '20px', 
        borderRadius: '16px', 
        backgroundColor: 'rgba(255, 255, 255, 0.22)', 
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.45)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <label className="eyebrow-label" style={{ display: 'block', marginBottom: '14px', fontSize: '11.5px', letterSpacing: '0.08em', color: '#000000', fontWeight: 850 }}>
          5. DINING OPTIONS
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: foodIncluded ? '16px' : '0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#000000', fontWeight: 750 }}>
            <input 
              type="radio" 
              name="food" 
              checked={!foodIncluded} 
              onChange={() => setFoodIncluded(false)} 
              disabled={disabled}
              style={{ accentColor: '#000000', width: '18px', height: '18px' }}
            />
            No Food Included
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#000000', fontWeight: 750 }}>
            <input 
              type="radio" 
              name="food" 
              checked={foodIncluded} 
              onChange={() => setFoodIncluded(true)} 
              disabled={disabled}
              style={{ accentColor: '#000000', width: '18px', height: '18px' }}
            />
            Food Included
          </label>
        </div>

        {/* Conditional Food Description */}
        {foodIncluded && (
          <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 800, color: '#000000' }}>
              Describe the included food/meal plan:
            </label>
            <textarea 
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
        style={{ width: '100%', padding: '17px', borderRadius: '14px', fontSize: '16px', fontWeight: 850 }}
        onClick={handleSubmit}
        disabled={disabled || selectedFiles.length === 0}
      >
        {disabled ? 'Evaluating Trust Signals...' : 'Evaluate Listing Trust'}
      </button>
    </div>
  );
};

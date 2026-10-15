import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface HotelSearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  category?: string;
}

interface HotelMapProps {
  initialCenter?: [number, number]; // [longitude, latitude]
  initialZoom?: number;
  height?: string;
  onSelectHotel?: (hotel: HotelSearchResult) => void;
}

export const HotelMap: React.FC<HotelMapProps> = ({
  initialCenter = [73.7553, 15.5527], // Default: Goa coast [lng, lat]
  initialZoom = 10,
  height = '420px',
  onSelectHotel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [centerCoords, setCenterCoords] = useState<[number, number]>(initialCenter);
  const [hasMoved, setHasMoved] = useState(false);

  // Read Mapbox Access Token safely from environment
  const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const isTokenConfigured = Boolean(token && !token.includes('your_mapbox_token_here'));

  // Hotel search function using Mapbox Search Box API (with category: hotel / lodging)
  const searchHotelsInArea = useCallback(async (coords: [number, number]) => {
    if (!isTokenConfigured) return;

    setLoading(true);
    setError(null);
    const [lng, lat] = coords;

    try {
      let results: HotelSearchResult[] = [];

      // 1. Primary: Mapbox Search Box API category search ("hotel")
      const searchBoxUrl = `https://api.mapbox.com/search/searchbox/v1/category/hotel?proximity=${lng},${lat}&limit=15&access_token=${token}`;
      const res = await fetch(searchBoxUrl);

      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          results = data.features.map((f: any) => ({
            id: f.properties?.mapbox_id || f.id || Math.random().toString(),
            name: f.properties?.name || 'Hotel / Lodge',
            address: f.properties?.full_address || f.properties?.place_formatted || f.properties?.address || 'Address unavailable',
            coordinates: f.geometry?.coordinates as [number, number],
            category: 'hotel',
          }));
        }
      }

      // 2. Secondary fallback / supplement: try "lodging" category or Geocoding API if Search Box had zero results
      if (results.length === 0) {
        const lodgingUrl = `https://api.mapbox.com/search/searchbox/v1/category/lodging?proximity=${lng},${lat}&limit=15&access_token=${token}`;
        const lodgingRes = await fetch(lodgingUrl);

        if (lodgingRes.ok) {
          const lodgingData = await lodgingRes.json();
          if (lodgingData.features && lodgingData.features.length > 0) {
            results = lodgingData.features.map((f: any) => ({
              id: f.properties?.mapbox_id || f.id || Math.random().toString(),
              name: f.properties?.name || 'Lodging',
              address: f.properties?.full_address || f.properties?.place_formatted || 'Address unavailable',
              coordinates: f.geometry?.coordinates as [number, number],
              category: 'lodging',
            }));
          }
        }
      }

      // 3. Fallback to standard Mapbox Geocoding POI if Search Box endpoint had no matches
      if (results.length === 0) {
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/hotel.json?proximity=${lng},${lat}&types=poi&limit=15&access_token=${token}`;
        const geocodeRes = await fetch(geocodeUrl);

        if (geocodeRes.ok) {
          const geocodeData = await geocodeRes.json();
          if (geocodeData.features) {
            results = geocodeData.features.map((f: any) => ({
              id: f.id,
              name: f.text || f.place_name?.split(',')[0] || 'Hotel',
              address: f.place_name || '',
              coordinates: f.center as [number, number],
              category: 'hotel',
            }));
          }
        }
      }

      setHotels(results);

      // Render markers on map
      if (mapRef.current) {
        // Clear previous markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        results.forEach((hotel) => {
          if (!hotel.coordinates || !mapRef.current) return;

          const popupContent = document.createElement('div');
          popupContent.style.padding = '8px';
          popupContent.style.color = '#1c1c1e';
          popupContent.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

          popupContent.innerHTML = `
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #000;">${hotel.name}</div>
            <div style="font-size: 12px; color: #636366; margin-bottom: 8px; line-height: 1.3;">${hotel.address}</div>
            <button id="select-btn-${hotel.id.replace(/[^a-zA-Z0-9]/g, '')}" style="
              background: #0a84ff; color: #fff; border: none; border-radius: 6px;
              padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer; width: 100%;
            ">Select this Lodge</button>
          `;

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
            .setDOMContent(popupContent);

          const marker = new mapboxgl.Marker({ color: '#0a84ff' })
            .setLngLat(hotel.coordinates)
            .setPopup(popup)
            .addTo(mapRef.current);

          popup.on('open', () => {
            const btn = document.getElementById(`select-btn-${hotel.id.replace(/[^a-zA-Z0-9]/g, '')}`);
            if (btn && onSelectHotel) {
              btn.onclick = () => {
                onSelectHotel(hotel);
                popup.remove();
              };
            }
          });

          markersRef.current.push(marker);
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search for hotels in this area');
    } finally {
      setLoading(false);
      setHasMoved(false);
    }
  }, [token, isTokenConfigured, onSelectHotel]);

const GLACIER_MAP_STYLE: any = {
  version: 8,
  sources: {
    'carto-glacier': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-glacier-layer',
      type: 'raster',
      source: 'carto-glacier',
      minzoom: 0,
      maxzoom: 20
    }
  ]
};

// Initialize Mapbox map in useEffect with cleanup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = token || '';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: GLACIER_MAP_STYLE,
      center: initialCenter, // [lng, lat]
      zoom: initialZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('moveend', () => {
      const center = map.getCenter();
      setCenterCoords([center.lng, center.lat]);
      setHasMoved(true);
    });

    map.on('load', () => {
      mapRef.current = map;
      searchHotelsInArea(initialCenter);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token, isTokenConfigured]);

  const handleSearchCurrentArea = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      searchHotelsInArea([center.lng, center.lat]);
    } else {
      searchHotelsInArea(centerCoords);
    }
  };

  return (
    <div className="hotel-mapbox-container" style={{
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.40)',
      backgroundColor: 'rgba(255, 255, 255, 0.20)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
      position: 'relative'
    }}>
      {/* Top Header / Control Bar */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0056b3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style={{ fontSize: '13.5px', fontWeight: 850, color: '#000000' }}>
            Mapbox Hotel & Lodge Explorer
          </span>
          {hotels.length > 0 && (
            <span style={{
              background: 'rgba(10, 132, 255, 0.15)',
              color: '#0056b3',
              border: '1px solid rgba(10, 132, 255, 0.3)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {hotels.length} found
            </span>
          )}
        </div>

        <button
          onClick={handleSearchCurrentArea}
          disabled={loading || !isTokenConfigured}
          style={{
            background: hasMoved ? '#0056b3' : 'rgba(255, 255, 255, 0.24)',
            color: hasMoved ? '#ffffff' : '#000000',
            border: hasMoved ? '1px solid #0056b3' : '1px solid rgba(255, 255, 255, 0.40)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)'
          }}
        >
          {loading ? 'Searching Area...' : hasMoved ? 'Search This Area' : 'Refresh Hotels'}
        </button>
      </div>

      {/* Token Notice if unconfigured */}
      {!isTokenConfigured ? (
        <div style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(16px)',
          color: '#000000'
        }}>
          <div style={{ marginBottom: '12px', color: '#0056b3' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <h4 style={{ fontSize: '17px', fontWeight: 850, margin: '0 0 8px 0', color: '#000000' }}>Mapbox Access Token Required</h4>
          <p style={{ fontSize: '13px', color: '#0F172A', maxWidth: '400px', lineHeight: 1.5, margin: '0 0 16px 0', fontWeight: 650 }}>
            Please set your Mapbox public token in <code style={{ background: 'rgba(15,23,42,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#000000', fontWeight: 800 }}>frontend/.env</code> under <code style={{ color: '#0056b3', fontWeight: 800 }}>VITE_MAPBOX_TOKEN</code> to activate interactive map searches.
          </p>
          <span style={{ fontSize: '11px', color: '#334155', fontWeight: 700 }}>Example: VITE_MAPBOX_TOKEN=pk.eyJ1...</span>
        </div>
      ) : (
        /* Map Container Div with explicit height */
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height }} 
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '55px',
          left: '16px',
          background: 'rgba(240, 245, 250, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          color: '#000000',
          fontWeight: 750,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)'
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0056b3', animation: 'pulse 1s infinite' }} />
          Querying Mapbox Search Box API...
        </div>
      )}

      {/* Error / Empty state banner */}
      {error && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '12px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#b91c1c',
          fontWeight: 750,
          zIndex: 2
        }}>
          {error}
        </div>
      )}

      {/* Empty Results state */}
      {!loading && isTokenConfigured && hotels.length === 0 && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(240, 245, 250, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#000000',
          fontWeight: 750,
          zIndex: 2,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)'
        }}>
          No hotels detected in this view. Pan or zoom the map and click "Search This Area".
        </div>
      )}
    </div>
  );
};

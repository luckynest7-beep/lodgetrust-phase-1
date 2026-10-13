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

const DARK_MAP_STYLE: any = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
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
      style: DARK_MAP_STYLE,
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
      border: '1px solid rgba(255, 255, 255, 0.12)',
      backgroundColor: '#1c1c1e',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      position: 'relative'
    }}>
      {/* Top Header / Control Bar */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#0a84ff', fontSize: '14px' }}>📍</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f7' }}>
            Mapbox Hotel & Lodge Explorer
          </span>
          {hotels.length > 0 && (
            <span style={{
              background: 'rgba(10, 132, 255, 0.2)',
              color: '#0a84ff',
              fontSize: '11px',
              fontWeight: 600,
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
            background: hasMoved ? '#0a84ff' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: hasMoved ? '1px solid #0a84ff' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {loading ? 'Searching Area...' : hasMoved ? '🔍 Search This Area' : '⟳ Refresh Hotels'}
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
          background: 'linear-gradient(180deg, rgba(28,28,30,0.9) 0%, rgba(18,18,20,0.95) 100%)',
          color: '#f5f5f7'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗺️</div>
          <h4 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 8px 0' }}>Mapbox Access Token Required</h4>
          <p style={{ fontSize: '13px', color: '#86868b', maxWidth: '400px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
            Please set your Mapbox public token in <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>frontend/.env</code> under <code style={{ color: '#0a84ff' }}>VITE_MAPBOX_TOKEN</code> to activate interactive map searches.
          </p>
          <span style={{ fontSize: '11px', color: '#636366' }}>Example: VITE_MAPBOX_TOKEN=pk.eyJ1...</span>
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
          background: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          color: '#d2d2d7',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 2
        }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#0a84ff', animation: 'pulse 1s infinite' }} />
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
          background: 'rgba(255, 59, 48, 0.2)',
          border: '1px solid rgba(255, 59, 48, 0.4)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#ff453a',
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
          background: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#86868b',
          zIndex: 2
        }}>
          No hotels detected in this view. Pan or zoom the map and click "Search This Area".
        </div>
      )}
    </div>
  );
};

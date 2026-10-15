import React, { useEffect, useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  getCities, 
  getHotels, 
  CityInfo, 
  HotelListing, 
  HotelFilterOptions 
} from '../lib/api';

// High-reliability basemap styles that never fail to render tiles
const MAP_STYLES: Record<string, any> = {
  streets: {
    version: 8,
    sources: {
      'osm-streets': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-streets-layer',
        type: 'raster',
        source: 'osm-streets',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  dark: {
    version: 8,
    sources: {
      'osm-dark': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-dark-layer',
        type: 'raster',
        source: 'osm-dark',
        paint: {
          'raster-brightness-max': 0.5,
          'raster-saturation': -0.85,
          'raster-contrast': 0.35
        },
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '&copy; Esri, Maxar, Earthstar Geographics'
      }
    },
    layers: [
      {
        id: 'esri-satellite-layer',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
};

interface HotelDiscoveryViewProps {
  onAuditListing?: (hotel: HotelListing) => void;
  onCompareListings?: (hotels: HotelListing[]) => void;
}

export const HotelDiscoveryView: React.FC<HotelDiscoveryViewProps> = ({ onAuditListing, onCompareListings }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  const [cities, setCities] = useState<CityInfo[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Chennai');
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  
  const [hotels, setHotels] = useState<HotelListing[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelListing | null>(null);
  const [comparisonList, setComparisonList] = useState<HotelListing[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [mapTheme, setMapTheme] = useState<'streets' | 'dark' | 'satellite'>('streets');

  // Filters
  const [accommodationType, setAccommodationType] = useState<string>('All');
  const [minStars, setMinStars] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'trust_score' | 'price_asc' | 'price_desc' | 'stars_desc'>('trust_score');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
  const isTokenConfigured = Boolean(token && !token.includes('your_mapbox_token_here'));

  // Load cities on mount
  useEffect(() => {
    async function fetchCities() {
      try {
        const cityData = await getCities();
        setCities(cityData);
      } catch (err: any) {
        console.warn('Failed to load cities list:', err);
      }
    }
    fetchCities();
  }, []);

  // Fetch hotels matching current filters
  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const options: HotelFilterOptions = {
        city: selectedCity,
        accommodation_type: accommodationType !== 'All' ? accommodationType : undefined,
        min_stars: minStars > 0 ? minStars : undefined,
        verified_only: verifiedOnly,
        sort_by: sortBy
      };
      const res = await getHotels(options);
      setHotels(res.hotels);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve hotel listings');
    } finally {
      setLoading(false);
    }
  }, [selectedCity, accommodationType, minStars, verifiedOnly, sortBy]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  // Handle map style changes
  const handleThemeChange = (theme: 'streets' | 'dark' | 'satellite') => {
    setMapTheme(theme);
    if (mapRef.current) {
      mapRef.current.setStyle(MAP_STYLES[theme]);
    }
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = token || '';

    // Find coordinates for initial city (default to Chennai coordinates)
    const cityInfo = cities.find(c => c.city.toLowerCase() === selectedCity.toLowerCase());
    const initialCoords: [number, number] = cityInfo ? cityInfo.coordinates : [80.2493, 13.0584]; // Chennai

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[mapTheme] || MAP_STYLES.dark,
      center: initialCoords,
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to selected city when city changes
  useEffect(() => {
    if (!mapRef.current) return;
    const cityInfo = cities.find(c => c.city.toLowerCase() === selectedCity.toLowerCase());
    if (cityInfo && Array.isArray(cityInfo.coordinates) && cityInfo.coordinates.length >= 2) {
      mapRef.current.flyTo({
        center: cityInfo.coordinates,
        zoom: 11,
        essential: true,
      });
    }
  }, [selectedCity, cities]);

  // Update map markers when hotels list updates
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    hotels.forEach(hotel => {
      // 1. Safe coordinate check: strictly guard against null, missing, NaN, or out-of-bounds coordinates
      if (
        !hotel.coordinates || 
        !Array.isArray(hotel.coordinates) || 
        hotel.coordinates.length < 2 || 
        hotel.coordinates[0] == null || 
        hotel.coordinates[1] == null || 
        isNaN(hotel.coordinates[0]) || 
        isNaN(hotel.coordinates[1]) ||
        hotel.coordinates[0] < -180 || hotel.coordinates[0] > 180 ||
        hotel.coordinates[1] < -90 || hotel.coordinates[1] > 90
      ) {
        return; // Safely skip invalid coordinates without crashing Mapbox
      }

      // 2. Safe information handling: strictly do NOT invent missing data
      const hotelName = (hotel.name && hotel.name.trim()) ? hotel.name.trim() : 'Name not available';
      const hotelAddress = (hotel.address && hotel.address.trim()) ? hotel.address.trim() : 'Address not available';
      const hotelType = (hotel.accommodation_type && hotel.accommodation_type.trim()) ? hotel.accommodation_type.trim() : 'Accommodation type not specified';
      
      const starText = (hotel.star_rating && hotel.star_rating > 0) 
        ? ` • ${'★'.repeat(Math.min(hotel.star_rating, 5))}` 
        : '';
        
      const priceText = (hotel.price_per_night && hotel.price_per_night > 0)
        ? `<div style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">₹${hotel.price_per_night.toLocaleString()} <span style="font-size: 11px; font-weight: 400; color: #636366;">/ night</span></div>`
        : `<div style="font-size: 12px; color: #636366; font-style: italic; margin-bottom: 8px;">Price not specified</div>`;

      // 3. Create outer marker container for Mapbox translation positioning
      const container = document.createElement('div');
      container.className = 'custom-map-marker-container';
      container.style.width = '36px';
      container.style.height = '36px';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.cursor = 'pointer';

      // 4. Create inner badge for visual styling and hover scaling.
      // Scaling this inner child prevents overwriting Mapbox's translate transform on the container!
      const badge = document.createElement('div');
      badge.className = 'custom-map-marker-badge';
      badge.style.width = '34px';
      badge.style.height = '34px';
      badge.style.borderRadius = '50%';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.fontSize = '11px';
      badge.style.fontWeight = '700';
      badge.style.color = '#ffffff';
      badge.style.cursor = 'pointer';
      badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
      badge.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease';
      badge.style.transformOrigin = 'center center';
      badge.style.userSelect = 'none';

      if (hotel.has_phase1_analysis && hotel.trust_score) {
        badge.style.backgroundColor = hotel.trust_score >= 90 ? '#34c759' : '#0a84ff';
        badge.style.border = '2px solid #ffffff';
        badge.innerText = `${Math.round(hotel.trust_score)}%`;
      } else {
        badge.style.backgroundColor = '#636366';
        badge.style.border = '2px solid rgba(255,255,255,0.7)';
        badge.innerText = 'H';
        badge.style.fontWeight = '800';
        badge.style.fontSize = '12px';
      }

      container.addEventListener('mouseenter', () => { 
        badge.style.transform = 'scale(1.22)'; 
        badge.style.boxShadow = '0 6px 18px rgba(0,0,0,0.7)';
      });
      container.addEventListener('mouseleave', () => { 
        badge.style.transform = 'scale(1)'; 
        badge.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
      });

      container.appendChild(badge);

      // Create popup displaying available hotel name, address, and accommodation type safely
      const cleanHotelId = String(hotel.id).replace(/[^a-zA-Z0-9]/g, '');
      const popupHTML = `
        <div style="color: #1c1c1e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 210px; max-width: 270px; padding: 2px;">
          <div style="font-size: 14px; font-weight: 700; color: #000; margin-bottom: 2px; line-height: 1.25;">${hotelName}</div>
          <div style="font-size: 11px; color: #007aff; font-weight: 600; margin-bottom: 4px;">${hotelType}${starText}</div>
          <div style="font-size: 12px; color: #3a3a3c; margin-bottom: 8px; line-height: 1.35;">${hotelAddress}</div>
          ${priceText}
          <div style="
            background: ${hotel.has_phase1_analysis ? 'rgba(52, 199, 89, 0.15)' : 'rgba(142, 142, 147, 0.15)'};
            color: ${hotel.has_phase1_analysis ? '#248a3d' : '#636366'};
            padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-bottom: 8px; text-align: center;
          ">
            ${hotel.has_phase1_analysis ? `◈ Benchmark Score (Sample): ${hotel.trust_score}%` : '○ Pending Live Audit'}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            ${onAuditListing ? `
              <button id="popup-audit-${cleanHotelId}" style="
                flex: 1; background: #34c759; color: #ffffff; border: none; border-radius: 6px;
                padding: 6px 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;
              ">Audit in Analysis</button>
            ` : ''}
            <button id="popup-compare-${cleanHotelId}" style="
              background: #0a84ff; color: #ffffff; border: none; border-radius: 6px;
              padding: 6px 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;
            ">+ Compare</button>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(popupHTML);

      // Attach button click handler when popup opens
      popup.on('open', () => {
        const auditBtn = document.getElementById(`popup-audit-${cleanHotelId}`);
        if (auditBtn && onAuditListing) {
          auditBtn.onclick = () => {
            onAuditListing(hotel);
          };
        }
        const compareBtn = document.getElementById(`popup-compare-${cleanHotelId}`);
        if (compareBtn) {
          compareBtn.onclick = () => {
            toggleComparison(hotel);
          };
        }
      });

      const marker = new mapboxgl.Marker({ element: container, anchor: 'center' })
        .setLngLat(hotel.coordinates)
        .setPopup(popup)
        .addTo(mapRef.current!);

      container.addEventListener('click', () => {
        setSelectedHotel(hotel);
      });

      markersRef.current[hotel.id] = marker;
    });
  }, [hotels, onAuditListing]);

  // Handle hotel selection from card
  const handleSelectHotelCard = (hotel: HotelListing) => {
    setSelectedHotel(hotel);
    if (mapRef.current && hotel.coordinates && Array.isArray(hotel.coordinates) && !isNaN(hotel.coordinates[0]) && !isNaN(hotel.coordinates[1])) {
      mapRef.current.flyTo({
        center: hotel.coordinates,
        zoom: 14,
        essential: true,
      });
      const marker = markersRef.current[hotel.id];
      if (marker) {
        marker.togglePopup();
      }
    }
  };

  // Toggle hotel comparison
  const toggleComparison = (hotel: HotelListing) => {
    if (comparisonList.some(h => h.id === hotel.id)) {
      setComparisonList(comparisonList.filter(h => h.id !== hotel.id));
    } else {
      if (comparisonList.length >= 3) {
        alert('You can compare up to 3 hotels at once.');
        return;
      }
      setComparisonList([...comparisonList, hotel]);
    }
  };

  return (
    <div className="hotel-discovery-view" style={{ color: '#000000', position: 'relative' }}>
      {/* Top Search & Filter Bar */}
      <div className="apple-card mb-4" style={{ padding: '24px', borderRadius: '24px', backgroundColor: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)', border: '1.5px solid rgba(255, 255, 255, 0.40)', boxShadow: 'var(--shadow-glass)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="eyebrow-label" style={{ color: '#0071E3', fontWeight: 850, letterSpacing: '0.09em', marginBottom: '4px' }}>
              VERIFIED LODGING DISCOVERY
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 850, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
              Explore Hotels & Lodges in India
            </h2>
          </div>

          {comparisonList.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowComparisonModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.20)',
                  backdropFilter: 'blur(14px)',
                  color: '#000000',
                  border: '1px solid rgba(255, 255, 255, 0.40)',
                  borderRadius: '12px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span>View Matrix</span>
                <span style={{ background: '#000000', color: '#FFFFFF', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                  {comparisonList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  if (onCompareListings) {
                    onCompareListings(comparisonList);
                  }
                }}
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span>Compare in Analysis</span>
                <span style={{ fontSize: '14px', fontWeight: 900 }}>→</span>
              </button>
            </div>
          )}
        </div>

        {/* City Quick Pills & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#000000' }}>Cities in India:</span>
          {cities.map(c => (
            <button
              key={c.city}
              onClick={() => setSelectedCity(c.city)}
              style={{
                background: selectedCity.toLowerCase() === c.city.toLowerCase() ? '#000000' : 'rgba(255, 255, 255, 0.20)',
                backdropFilter: 'blur(14px)',
                color: selectedCity.toLowerCase() === c.city.toLowerCase() ? '#FFFFFF' : '#000000',
                border: selectedCity.toLowerCase() === c.city.toLowerCase() ? '1.5px solid #000000' : '1px solid rgba(255, 255, 255, 0.40)',
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: selectedCity.toLowerCase() === c.city.toLowerCase() ? '0 4px 12px rgba(0,0,0,0.25)' : 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              {c.city} ({c.hotel_count})
            </button>
          ))}
        </div>

        {/* Secondary Filter Row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.35)' }}>
          {/* Accommodation Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: '#000000', fontWeight: 800 }}>Type:</span>
            <select
              value={accommodationType}
              onChange={(e) => setAccommodationType(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(14px)', color: '#000000', border: '1.5px solid rgba(255, 255, 255, 0.40)',
                padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 750, outline: 'none'
              }}
            >
              <option value="All">All Types</option>
              <option value="Hotel">Hotel</option>
              <option value="Resort">Resort</option>
              <option value="Heritage Palace">Heritage Palace</option>
              <option value="Boutique Lodge">Boutique Lodge</option>
            </select>
          </div>

          {/* Star Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: '#000000', fontWeight: 800 }}>Stars:</span>
            <select
              value={minStars}
              onChange={(e) => setMinStars(Number(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(14px)', color: '#000000', border: '1.5px solid rgba(255, 255, 255, 0.40)',
                padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 750, outline: 'none'
              }}
            >
              <option value={0}>Any Stars</option>
              <option value={3}>3+ Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={5}>5 Stars Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', color: '#000000', fontWeight: 800 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.20)', backdropFilter: 'blur(14px)', color: '#000000', border: '1.5px solid rgba(255, 255, 255, 0.40)',
                padding: '7px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 750, outline: 'none'
              }}
            >
              <option value="trust_score">LodgeTrust Trust Score (High to Low)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stars_desc">Star Rating</option>
            </select>
          </div>

          {/* Verified Only Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 750, color: '#000000', marginLeft: 'auto' }}>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              style={{ accentColor: '#059669', width: '18px', height: '18px' }}
            />
            <span>Audited Benchmark Listings Only</span>
          </label>
        </div>
      </div>

      {/* Main Content Grid: Map (Left/Top) & Listings (Right/Bottom) */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Map Column */}
        <div style={{ flex: '1 1 55%', minWidth: '380px' }}>
          <div className="apple-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', height: '560px', position: 'relative' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Map Theme Selector Overlay */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(28, 28, 30, 0.88)',
              backdropFilter: 'blur(16px)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              gap: '4px',
              zIndex: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}>
              {(['streets', 'dark', 'satellite'] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  style={{
                    background: mapTheme === theme ? '#0a84ff' : 'transparent',
                    color: mapTheme === theme ? '#ffffff' : '#8e8e93',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {theme === 'streets' ? 'Streets' : theme === 'dark' ? 'Dark' : 'Satellite'}
                </button>
              ))}
            </div>
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(28, 28, 30, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '11px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              zIndex: 2
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#34c759', display: 'inline-block' }} />
                <span>Verified Trust Score &gt; 90%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0a84ff', display: 'inline-block' }} />
                <span>Verified Trust Score 80-89%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#636366', display: 'inline-block' }} />
                <span>Pending Audit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Cards Column */}
        <div style={{ flex: '1 1 40%', minWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '560px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#86868b' }}>
              Showing {hotels.length} verified listings in {selectedCity}
            </span>
          </div>

          {loading && (
            <div className="apple-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div className="apple-spinner" style={{ margin: '0 auto 16px auto' }} />
              <p style={{ color: '#86868b', fontSize: '14px', margin: 0 }}>Querying LodgeTrust verified database...</p>
            </div>
          )}

          {!loading && hotels.length === 0 && (
            <div className="apple-card" style={{ padding: '32px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.40)' }}>
              <p style={{ color: '#000000', fontSize: '15px', fontWeight: 850, margin: 0 }}>No hotels match the selected filter criteria.</p>
            </div>
          )}

          {!loading && hotels.map(hotel => {
            const isCompared = comparisonList.some(h => h.id === hotel.id);
            const isSelected = selectedHotel?.id === hotel.id;

            return (
              <div 
                key={hotel.id}
                className="apple-card"
                onClick={() => handleSelectHotelCard(hotel)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #0056b3' : '1px solid rgba(255, 255, 255, 0.40)',
                  background: isSelected ? 'rgba(10, 132, 255, 0.18)' : 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(16px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
                  boxShadow: isSelected ? '0 8px 24px rgba(10, 132, 255, 0.2)' : '0 4px 16px rgba(15, 23, 42, 0.06)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 850, margin: '0 0 4px 0', color: '#000000', letterSpacing: '-0.02em' }}>
                      {hotel.name || 'Name not available'}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#0F172A', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700 }}>
                      <span style={{ color: '#000000' }}>{hotel.accommodation_type || 'Hotel'}</span>
                      {hotel.star_rating > 0 && (
                        <>
                          <span>•</span>
                          <span style={{ color: '#b45309', fontWeight: 800 }}>{'★'.repeat(Math.min(hotel.star_rating, 5))}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{hotel.city}</span>
                    </div>
                  </div>

                  {/* Trust Score Pill */}
                  <div>
                    {hotel.has_phase1_analysis && typeof hotel.trust_score === 'number' ? (
                      <div style={{
                        background: hotel.trust_score >= 90 ? 'rgba(22, 101, 52, 0.15)' : 'rgba(10, 132, 255, 0.15)',
                        color: hotel.trust_score >= 90 ? '#15803d' : '#0056b3',
                        border: `1.5px solid ${hotel.trust_score >= 90 ? '#15803d' : '#0056b3'}`,
                        borderRadius: '12px',
                        padding: '4px 10px',
                        fontSize: '13px',
                        fontWeight: 850,
                        textAlign: 'center'
                      }}>
                        {hotel.trust_score}% Benchmark
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.22)',
                        color: '#0F172A',
                        border: '1px solid rgba(255, 255, 255, 0.40)',
                        borderRadius: '12px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        Pending Audit
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <p style={{ fontSize: '12.5px', color: '#0F172A', margin: '0 0 12px 0', lineHeight: 1.4, fontWeight: 650 }}>
                  {hotel.address || 'Address not available'}
                </p>

                {/* Amenities pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {hotel.amenities.slice(0, 4).map(a => (
                    <span 
                      key={a}
                      style={{
                        background: 'rgba(255, 255, 255, 0.22)',
                        color: '#000000',
                        fontSize: '11.5px',
                        fontWeight: 750,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.40)'
                      }}
                    >
                      {a}
                    </span>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <span style={{ fontSize: '11px', color: '#0F172A', alignSelf: 'center', fontWeight: 800 }}>
                      +{hotel.amenities.length - 4} more
                    </span>
                  )}
                </div>

                {/* Footer / Price & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <div>
                    {hotel.price_per_night > 0 ? (
                      <>
                        <span style={{ fontSize: '19px', fontWeight: 900, color: '#000000' }}>
                          ₹{hotel.price_per_night.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '12px', color: '#0F172A', marginLeft: '4px', fontWeight: 750 }}>/ night</span>
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#0F172A', fontStyle: 'italic', fontWeight: 700 }}>
                        Price not specified
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComparison(hotel);
                      }}
                      style={{
                        background: isCompared ? '#0056b3' : 'rgba(255, 255, 255, 0.32)',
                        color: isCompared ? '#ffffff' : '#000000',
                        border: isCompared ? '1px solid #0056b3' : '1px solid rgba(255, 255, 255, 0.45)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                      {isCompared ? '✓ Added' : '+ Compare'}
                    </button>

                    {onAuditListing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAuditListing(hotel);
                        }}
                        style={{
                          background: '#15803d',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)'
                        }}
                      >
                        Audit in Analysis
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Modal Drawer */}
      {showComparisonModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div className="apple-card" style={{ maxWidth: '960px', width: '100%', padding: '32px', borderRadius: '24px', maxHeight: '90vh', overflowY: 'auto', background: 'rgba(240, 248, 255, 0.40)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', border: '1.5px solid rgba(255, 255, 255, 0.50)', boxShadow: '0 24px 60px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="eyebrow-label" style={{ color: '#0056b3', marginBottom: '4px', fontWeight: 850 }}>LISTING COMPARISON MATRIX</div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: '#000000' }}>Side-by-Side Trust Evaluation</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setShowComparisonModal(false);
                    if (onCompareListings) {
                      onCompareListings(comparisonList);
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0a84ff 0%, #0056b3 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(10, 132, 255, 0.4)'
                  }}
                >
                  <span>Audit & Compare in Analysis</span>
                  <span style={{ fontSize: '14px', fontWeight: 900 }}>→</span>
                </button>
                <button 
                  onClick={() => setShowComparisonModal(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.3)', color: '#000000', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparisonList.length}, 1fr)`, gap: '20px' }}>
              {comparisonList.map(h => (
                <div key={h.id} style={{ background: 'rgba(255, 255, 255, 0.24)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.45)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 850, margin: '0 0 6px 0', color: '#000000' }}>{h.name}</h4>
                  <div style={{ color: '#b45309', fontSize: '13px', marginBottom: '12px', fontWeight: 800 }}>{'★'.repeat(h.star_rating)} • {h.accommodation_type}</div>
                  
                  {/* Trust Score Box */}
                  <div style={{
                    background: h.has_phase1_analysis ? 'rgba(22, 101, 52, 0.12)' : 'rgba(255, 255, 255, 0.25)',
                    border: `1.5px solid ${h.has_phase1_analysis ? '#15803d' : 'rgba(255, 255, 255, 0.45)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#0F172A', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 850 }}>LodgeTrust Verdict</div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: h.has_phase1_analysis ? '#15803d' : '#0F172A' }}>
                      {h.has_phase1_analysis ? `${h.trust_score}%` : 'Unverified'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#0F172A', marginTop: '2px', fontWeight: 750 }}>
                      {h.has_phase1_analysis ? `Audit Date: ${h.verified_date}` : 'Pending Multimodal Review'}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#0F172A', flex: 1, fontWeight: 700 }}>
                    <div><strong style={{ color: '#000000' }}>Tariff:</strong> {h.price_per_night > 0 ? `₹${h.price_per_night.toLocaleString()} / night` : 'Price not specified'}</div>
                    <div><strong style={{ color: '#000000' }}>Location:</strong> {h.city}, {h.state}</div>
                    {h.aesthetic_score && <div><strong style={{ color: '#000000' }}>Aesthetic Score:</strong> {h.aesthetic_score} / 10</div>}
                    {h.compliance_ratio && <div><strong style={{ color: '#000000' }}>HRACC Compliance:</strong> {Math.round(h.compliance_ratio * 100)}%</div>}
                    <div style={{ marginTop: '8px' }}>
                      <strong style={{ color: '#000000' }}>Amenities:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {h.amenities.map(a => (
                          <span key={a} style={{ fontSize: '10.5px', background: 'rgba(255, 255, 255, 0.4)', color: '#000000', fontWeight: 750, padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.45)' }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Individual Audit Button */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.3)' }}>
                    <button
                      onClick={() => {
                        setShowComparisonModal(false);
                        if (onAuditListing) {
                          onAuditListing(h);
                        }
                      }}
                      style={{
                        width: '100%',
                        background: '#15803d',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)'
                      }}
                    >
                      <span>Audit this Listing in Analysis</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Comparison Dock */}
      {comparisonList.length > 0 && !showComparisonModal && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.24)',
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          padding: '12px 20px',
          borderRadius: '20px',
          border: '1.5px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 850, color: '#000000' }}>
              {comparisonList.length} {comparisonList.length === 1 ? 'hotel' : 'hotels'} selected to compare
            </span>
          </div>

          <button
            onClick={() => setShowComparisonModal(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.35)',
              color: '#000000',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)'
            }}
          >
            Side-by-Side Matrix
          </button>

          <button
            onClick={() => {
              if (onCompareListings) {
                onCompareListings(comparisonList);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #0a84ff 0%, #0056b3 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(10, 132, 255, 0.4)'
            }}
          >
            <span>Move to Analysis</span>
            <span style={{ fontSize: '14px', fontWeight: 900 }}>→</span>
          </button>

          <button
            onClick={() => setComparisonList([])}
            style={{
              background: 'transparent',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 850,
              padding: '4px'
            }}
            title="Clear comparison list"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getDoseColor, getDoseLabel } from '../utils/iaeaScale';

const ONLINE_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const MapView = ({
  center = [20.5937, 78.9629],
  zoom = 15,
  markers = [],
  currentReading = null,
  showTrail = true,
  trailColor = '#22c55e'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const trailLayerRef = useRef(null);
  const currentMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const initializedRef = useRef(false);
  const [tileUrl, setTileUrl] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const loadTileUrl = async () => {
      try {
        if (!window.electronAPI?.map) {
          setTileUrl(ONLINE_TILE_URL);
          return;
        }
        const offlineUrl = await window.electronAPI.map.getTileUrl();
        const hasOffline = await window.electronAPI.map.hasOfflineTiles();
        if (offlineUrl && hasOffline) {
          setTileUrl(offlineUrl);
        } else {
          setTileUrl(ONLINE_TILE_URL);
        }
      } catch {
        setTileUrl(ONLINE_TILE_URL);
      }
    };
    loadTileUrl();
  }, []);

  useEffect(() => {
    if (!mapRef.current || initializedRef.current || !tileUrl) return;
    initializedRef.current = true;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18,
      tileSize: 256,
      attribution: ''
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    L.control.attribution({
      prefix: '<span style="opacity:0.4;font-size:10px">ARGM</span>'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    trailLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      initializedRef.current = false;
      setMapReady(false);
    };
  }, [tileUrl]);

  useEffect(() => {
    if (!mapInstanceRef.current || !currentReading) return;

    const { latitude, longitude, doseRate } = currentReading;
    if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) return;

    const latlng = [latitude, longitude];
    const color = getDoseColor(doseRate);

    if (currentMarkerRef.current) {
      mapInstanceRef.current.removeLayer(currentMarkerRef.current);
    }

    const currentIcon = L.divIcon({
      className: 'current-position-marker',
      html: `
        <div style="position:relative;width:32px;height:32px;">
          <!-- Pulse rings -->
          <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0.3;animation:ring-pulse 2s ease-out infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0.2;animation:ring-pulse 2s ease-out infinite 0.5s;"></div>
          <!-- Center dot -->
          <div style="
            position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            width:14px;height:14px;
            background:${color};
            border:3px solid white;
            border-radius:50%;
            box-shadow:0 0 20px ${color}80, 0 0 40px ${color}40, 0 4px 12px rgba(0,0,0,0.4);
          "></div>
          <!-- Label -->
          <div style="
            position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:8px;
            background:rgba(15,23,42,0.9);backdrop-filter:blur(12px);
            border:1px solid rgba(100,116,139,0.2);
            color:white;padding:4px 10px;border-radius:8px;
            font-size:11px;font-family:monospace;font-weight:bold;
            white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.3);
          ">
            <span style="color:${color}">${doseRate?.toFixed(4) || '0.00'}</span>
            <span style="color:#64748b;margin-left:3px">µSv/h</span>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    currentMarkerRef.current = L.marker(latlng, { icon: currentIcon })
      .addTo(mapInstanceRef.current);

    mapInstanceRef.current.panTo(latlng, { animate: true });

    if (showTrail && trailLayerRef.current) {
      L.circleMarker(latlng, {
        radius: 3,
        fillColor: trailColor,
        fillOpacity: 0.7,
        stroke: false
      }).addTo(trailLayerRef.current);
    }
  }, [currentReading, showTrail, trailColor]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      if (!marker.latitude || !marker.longitude) return;

      const color = getDoseColor(marker.doseRate);

      const icon = L.divIcon({
        className: 'dose-marker',
        html: `
          <div style="
            width:10px;height:10px;
            background:${color};
            border:2px solid white;
            border-radius:50%;
            box-shadow:0 0 8px ${color}60, 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      L.marker([marker.latitude, marker.longitude], { icon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px;padding:2px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:white;">Reading</div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(100,116,139,0.2);">
              <span style="color:#94a3b8;font-size:12px;">Dose</span>
              <span style="color:${color};font-weight:600;font-size:12px;font-family:monospace;">${marker.doseRate?.toFixed(4) || 'N/A'} µSv/h</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(100,116,139,0.2);">
              <span style="color:#94a3b8;font-size:12px;">Level</span>
              <span style="color:${color};font-weight:600;font-size:12px;">${getDoseLabel(marker.doseRate)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;">
              <span style="color:#94a3b8;font-size:12px;">Time</span>
              <span style="color:#cbd5e1;font-size:11px;font-family:monospace;">${marker.timestamp ? new Date(marker.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
        `, { className: 'custom-popup' })
        .addTo(markersLayerRef.current);
    });
  }, [markers]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" style={{ borderRadius: '12px' }} />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(8, 15, 30, 0.95)' }}>
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-sm text-slate-400 font-medium">Loading map tiles...</p>
          </div>
        </div>
      )}

      {/* Attribution overlay */}
      <div className="absolute bottom-1 right-2 z-[400] px-2 py-1 rounded-md text-[9px] text-slate-500"
        style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
        ARGM Offline Map
      </div>

      <style>{`
        @keyframes ring-pulse {
          0% { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(100, 116, 139, 0.2) !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
        }
      `}</style>
    </div>
  );
};

export default MapView;

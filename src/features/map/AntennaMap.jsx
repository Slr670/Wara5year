import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { MapLegend } from './MapLegend.jsx';
import { BRACKET_CONFIG } from '../../config/brackets.config.js';

export function AntennaMap({ stations = [], selectedStation = null, onSelectStation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLayer, setMapLayer] = useState('hybrid'); // 'hybrid' | 'streets'

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.736717, 100.523186],
        zoom: 7,
        zoomControl: false
      });

      mapRef.current = map;

      // Google Satellite Hybrid layer
      const hybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy; Google',
        maxZoom: 20
      });

      // Google Streets layer
      const streetsLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy; Google',
        maxZoom: 20
      });

      hybridLayer.addTo(map);
      map._hybridLayer = hybridLayer;
      map._streetsLayer = streetsLayer;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Switch Layer
  const toggleLayer = () => {
    const map = mapRef.current;
    if (!map) return;
    if (mapLayer === 'hybrid') {
      map.removeLayer(map._hybridLayer);
      map._streetsLayer.addTo(map);
      setMapLayer('streets');
    } else {
      map.removeLayer(map._streetsLayer);
      map._hybridLayer.addTo(map);
      setMapLayer('hybrid');
    }
  };

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const bounds = [];

    stations.forEach(station => {
      if (!station.lat || !station.lng) return;

      const bracket = BRACKET_CONFIG.find(b => b.key === station.termKey) || BRACKET_CONFIG[5];
      const pinColor = bracket.color;

      // Custom SVG Pin
      const iconHtml = `
        <div style="position: relative; width: 30px; height: 38px; transform: translate(-15px, -38px); cursor: pointer;">
          <svg width="30" height="38" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.372 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.372-12-12-12z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.5"/>
            <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-antenna-pin',
        html: iconHtml,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
        popupAnchor: [0, -38]
      });

      const popupContent = `
        <div style="font-family:'Prompt',sans-serif; min-width: 220px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 2px; color: #1e3a8a;">
            ${station.village}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            ต.${station.subdistrict} อ.${station.district} จ.${station.province}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding: 4px 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
            <span style="font-size: 11px; color: #475569;">วาระคงเหลือ:</span>
            <span style="font-weight: 700; font-size: 12px; color: ${pinColor};">${station.term}</span>
          </div>
          <div style="display: flex; gap: 4px; font-size: 11px; color: #334155;">
            <span style="background:#eff6ff; color:#1d4ed8; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">เสา ${station.towerHeight || '9'} ม.</span>
            <span style="background:#f1f5f9; color:#475569; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1;">${station.typicalType || 'Type C'}</span>
          </div>
          ${station.phone ? `<div style="font-size: 11px; color: #475569; margin-top: 6px;">โทร: ${station.phone}</div>` : ''}
        </div>
      `;

      const marker = L.marker([station.lat, station.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(station);
      });

      markersRef.current.push(marker);
      bounds.push([station.lat, station.lng]);
    });

    if (bounds.length > 0 && !selectedStation) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [stations, selectedStation, onSelectStation]);

  // Zoom to selected station if changed
  useEffect(() => {
    if (selectedStation && selectedStation.lat && selectedStation.lng && mapRef.current) {
      mapRef.current.setView([selectedStation.lat, selectedStation.lng], 14, { animate: true });
    }
  }, [selectedStation]);

  return (
    <Card className="overflow-hidden mb-6">
      <CardHeader className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>แผนที่ตำแหน่งสถานีและวาระเจ้าหน้าที่รัฐ ({stations.length} สถานี)</span>
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">
            คลิกที่หมุดบนแผนที่เพื่อดูรายละเอียดสถานีและความสูงเสาอากาศ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleLayer}
            className="text-xs h-8"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{mapLayer === 'hybrid' ? 'ภาพดาวเทียม' : 'แผนที่ถนน'}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => mapRef.current?.zoomIn()}
            className="h-8 w-8"
            title="ขยาย"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => mapRef.current?.zoomOut()}
            className="h-8 w-8"
            title="ย่อ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        <div ref={mapContainerRef} className="w-full h-[400px] sm:h-[480px] z-10" />
        {/* Floating Legend Overlay */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/80 shadow-lg">
          <MapLegend />
        </div>
      </CardContent>
    </Card>
  );
}

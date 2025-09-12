'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leafletのデフォルトアイコンが正しく表示されない問題を修正
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});

interface MapProps {
  geoJsonData: any; // TODO: Define a proper GeoJSON type
}

const Map = ({ geoJsonData }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (mapRef.current && geoJsonData && geoJsonData.features.length > 0) {
        const geoJsonLayer = L.geoJSON(geoJsonData);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds);
        }
    }
  }, [geoJsonData]);

  return (
    <MapContainer 
      center={[36.34, 140.45]} 
      zoom={9} 
      style={{ height: '100%', width: '100%' }}
      whenCreated={map => mapRef.current = map}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && (
        <GeoJSON 
          key={JSON.stringify(geoJsonData)} // Re-render when data changes
          data={geoJsonData}
          style={() => ({
            fillColor: '#0080ff',
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7
          })}
        />
      )}
    </MapContainer>
  );
};

export default Map;

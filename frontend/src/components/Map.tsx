'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoJsonObject } from 'geojson';

// Import image assets directly for webpack processing
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// This is a known workaround for a common issue with Leaflet and React/Webpack.
// It prevents errors during the build process related to icon paths.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
});

interface MapProps {
  geoJsonData: FeatureCollection | null;
}

const Map = ({ geoJsonData }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // The geoJsonData prop is now guaranteed to be a FeatureCollection or null.
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
      whenCreated={(map) => {
        mapRef.current = map;
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && (
        <GeoJSON
          key={JSON.stringify(geoJsonData)}
          data={geoJsonData}
          style={() => ({
            fillColor: '#0080ff',
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.7,
          })}
        />
      )}
    </MapContainer>
  );
};

export default Map;

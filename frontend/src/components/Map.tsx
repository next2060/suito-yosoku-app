'use client';

import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // IMPORTANT: You need to replace this with your own MapTiler API key
  // You can get a free key from https://www.maptiler.com/
  const apiKey = 'TzMkX0NRgisD7fdG1HLC';

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // initialize map only once (force re-deploy)
    
    if (!apiKey) {
        console.error("MapTiler API key is missing. Please add it to src/components/Map.tsx");
        if (mapContainer.current) {
            mapContainer.current.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100%; background-color: #f0f0f0; color: #333;">MapTiler API Key is missing.</div>';
        }
        return;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [139.753, 35.689],
      zoom: 5,
    });

    map.current.on('load', () => {
        if (!map.current) return;

        const wfsUrl = 'https://suito-yosoku.com/ows/?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=m2025_082015&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326';

        map.current.addSource('qgis-wfs', {
            type: 'geojson',
            data: wfsUrl
        });

        map.current.addLayer({
            'id': 'qgis-layer-fill',
            'type': 'fill',
            'source': 'qgis-wfs',
            'paint': {
                'fill-color': '#0080ff',
                'fill-opacity': 0.5
            }
        });
        map.current.addLayer({
            'id': 'qgis-layer-outline',
            'type': 'line',
            'source': 'qgis-wfs',
            'paint': {
                'line-color': '#000000',
                'line-width': 1
            }
        });
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Clean up on unmount
    return () => {
        map.current?.remove();
    };
  }, [apiKey]);

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  );
};

export default Map;

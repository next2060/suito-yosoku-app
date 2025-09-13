'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureCollection, Feature } from 'geojson';

// アイコン画像のインポートと設定
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
});

// 親コンポーネントから渡されるPropsの型定義
interface MapProps {
  geoJsonData: FeatureCollection | null;
  selectedFeatureId: string | null;
  onFeatureSelect: (id: string, feature: Feature) => void; // IDとFeature全体を渡す
}

const Map = ({ geoJsonData, selectedFeatureId, onFeatureSelect }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);

  // 地図の表示範囲をデータに合わせて調整
  useEffect(() => {
    if (mapRef.current && geoJsonData && geoJsonData.features.length > 0) {
      const geoJsonLayer = L.geoJSON(geoJsonData);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [geoJsonData]);

  // 各ポリゴン（圃場）のスタイルを定義
  const getStyle = (feature: Feature) => {
    const id = feature.properties?.polygon_uuid || feature.properties?.M_CODE;
    const isSelected = id === selectedFeatureId;
    return {
      fillColor: isSelected ? '#ff7800' : '#0080ff', // 選択されているかで色を変更
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7,
    };
  };

  // 各ポリゴンがクリックされたときの処理
  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    layer.on({
      click: () => {
        const id = feature.properties?.polygon_uuid || feature.properties?.M_CODE;
        if (id) {
          onFeatureSelect(id, feature); // 親コンポーネントに選択されたことを通知
        }
      },
    });
  };

  return (
    <MapContainer
      center={[36.34, 140.45]}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && (
        <GeoJSON
          key={JSON.stringify(geoJsonData)} // データが変更されたら再描画
          data={geoJsonData}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
};

export default Map;

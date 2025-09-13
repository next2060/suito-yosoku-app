'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GeoJsonObject } from 'geojson';

// Mapコンポーネントをダイナミックインポートし、サーバーサイドレンダリング(SSR)を無効にする
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div style={{height: '100%', background: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>地図を読み込み中...</div>
});

const MUNICIPALITY_LAYERS = [
    { value: 'm2025_082015', label: '水戸市' }, { value: 'm2025_082023', label: '日立市' },
    { value: 'm2025_082031', label: '土浦市' }, { value: 'm2025_082040', label: '古河市' },
    { value: 'm2025_082058', label: '石岡市' }, { value: 'm2025_082074', label: '結城市' },
    { value: 'm2025_082082', label: '龍ケ崎市' }, { value: 'm2025_082104', label: '下妻市' },
    { value: 'm2025_082112', label: '常総市' }, { value: 'm2025_082121', label: '常陸太田市' },
    { value: 'm2025_082147', label: '高萩市' }, { value: 'm2025_082155', label: '北茨城市' },
    { value: 'm2025_082163', label: '笠間市' }, { value: 'm2025_082171', label: '取手市' },
    { value: 'm2025_082198', label: '牛久市' }, { value: 'm2025_082201', label: 'つくば市' },
    { value: 'm2025_082210', label: 'ひたちなか市' }, { value: 'm2025_082228', label: '鹿嶋市' },
    { value: 'm2025_082236', label: '潮来市' }, { value: 'm2025_082244', label: '守谷市' },
    { value: 'm2025_082252', label: '常陸大宮市' }, { value: 'm2025_082261', label: '那珂市' },
    { value: 'm2025_082279', label: '筑西市' }, { value: 'm2025_082287', label: '坂東市' },
    { value: 'm2025_082295', label: '稲敷市' }, { value: 'm2025_082309', label: 'かすみがうら市' },
    { value: 'm2025_082317', label: '桜川市' }, { value: 'm2025_082325', label: '神栖市' },
    { value: 'm2025_082333', label: '行方市' }, { value: 'm2025_082341', label: '鉾田市' },
    { value: 'm2025_082350', label: 'つくばみらい市' }, { value: 'm2025_082368', label: '小美玉市' },
    { value: 'm2025_083020', label: '茨城町' }, { value: 'm2025_083097', label: '大洗町' },
    { value: 'm2025_083101', label: '城里町' }, { value: 'm2025_083411', label: '東海村' },
    { value: 'm2025_083640', label: '大子町' }, { value: 'm2025_084425', label: '美浦村' },
    { value: 'm2025_084433', label: '阿見町' }, { value: 'm2025_084476', label: '河内町' },
    { value: 'm2025_085219', label: '八千代町' }, { value: 'm2025_085421', label: '五霞町' },
    { value: 'm2025_085464', label: '境町' }, { value: 'm2025_085642', label: '利根町' }
];

export default function Home() {
  const [selectedLayer, setSelectedLayer] = useState(MUNICIPALITY_LAYERS[22].value); // Default to 筑西市
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLayerData = async () => {
      if (!selectedLayer) return;

      setIsLoading(true);
      setError(null);
      setGeoJsonData(null);

      // 環境変数からQGISサーバーのURLを取得
      const qgisServerUrl = process.env.NEXT_PUBLIC_QGIS_SERVER_URL;
      if (!qgisServerUrl) {
        setError('QGISサーバーのURLが設定されていません。 (.env.local)');
        setIsLoading(false);
        return;
      }

      const wfsUrl = `${qgisServerUrl}/ows/?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=${selectedLayer}&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326`;

      try {
        const response = await fetch(wfsUrl);
        if (!response.ok) {
          throw new Error(`サーバーからの応答エラー: ${response.status}`);
        }
        const data = await response.json();
        if (!data.features) {
          // No features is not an error, just means the layer is empty
          setGeoJsonData(() => ({ type: 'FeatureCollection', features: [] }));
        } else {
          setGeoJsonData(data);
        }
      } catch (e: unknown) {
        console.error("レイヤーデータの取得に失敗しました:", e);
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred while fetching layer data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLayerData();
  }, [selectedLayer]);

  return (
    <main className="flex h-screen">
      <div className="w-1/4 p-4 overflow-y-auto bg-gray-100">
        <h2 className="text-xl font-bold mb-4">操作パネル</h2>
        
        <div>
          <h3 className="font-semibold">市町村選択</h3>
          <select 
            value={selectedLayer} 
            onChange={(e) => setSelectedLayer(e.target.value)} 
            className="w-full p-2 border rounded mt-1"
          >
            {MUNICIPALITY_LAYERS.map(layer => (
              <option key={layer.value} value={layer.value}>{layer.label}</option>
            ))}
          </select>
        </div>

        {isLoading && <div className="mt-4">読み込み中...</div>}
        {error && <div className="mt-4 text-red-500">エラー: {error}</div>}

      </div>
      <div className="flex-1">
        <Map geoJsonData={geoJsonData} />
      </div>
    </main>
  );
}

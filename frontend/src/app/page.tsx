'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FeatureCollection, Feature } from 'geojson';
import { centerOfMass } from '@turf/turf';

// Mapコンポーネントをダイナミックインポート
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div style={{height: '100%', background: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>地図を読み込み中...</div>
});

// --- 型定義 ---
interface PredictionResult {
  heading_date: string;
  maturity_date: string;
}

// --- 定数 ---
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
const VARIETIES = ['あきたこまち', 'コシヒカリ', 'にじのきらめき'];

export default function Home() {
  // --- State定義 ---
  const [selectedLayer, setSelectedLayer] = useState(MUNICIPALITY_LAYERS[22].value);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [transplantDate, setTransplantDate] = useState('');
  const [variety, setVariety] = useState(VARIETIES[0]);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // --- 地図データ取得 --- 
  useEffect(() => {
    const fetchLayerData = async () => {
      if (!selectedLayer) return;
      setIsLoading(true);
      setError(null);
      setGeoJsonData(null);
      setSelectedFeature(null);
      setSelectedFeatureId(null);

      const qgisServerUrl = process.env.NEXT_PUBLIC_QGIS_SERVER_URL || 'https://suito-yosoku.com';
      const wfsUrl = `${qgisServerUrl}/ows/?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=${selectedLayer}&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326`;

      try {
        const response = await fetch(wfsUrl);
        if (!response.ok) throw new Error(`サーバーからの応答エラー: ${response.status}`);
        const data = await response.json() as FeatureCollection;
        setGeoJsonData(data);
      } catch (e: unknown) {
        console.error("レイヤーデータの取得に失敗しました:", e);
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLayerData();
  }, [selectedLayer]);

  // --- 地図クリック処理 ---
  const handleFeatureSelect = (id: string, feature: Feature) => {
    setSelectedFeatureId(id);
    setSelectedFeature(feature);
    setPredictionResult(null);
    setPredictionError(null);
  };

  // --- 生育予測実行処理 ---
  const handlePredict = async () => {
    if (!selectedFeature || !transplantDate || !variety) {
      setPredictionError('圃場を選択し、移植日と品種を入力してください。');
      return;
    }

    setIsPredicting(true);
    setPredictionError(null);
    setPredictionResult(null);

    try {
      const center = centerOfMass(selectedFeature.geometry);
      const [lon, lat] = center.geometry.coordinates;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://suito-yosoku.com/api';
      
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lon,
          transplantDate: transplantDate,
          variety: variety,
          weatherUser: process.env.NEXT_PUBLIC_WEATHER_USER,
          weatherPassword: process.env.NEXT_PUBLIC_WEATHER_PASS,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `APIエラー: ${response.status}`);
      setPredictionResult(result);
    } catch (e: unknown) {
      console.error("予測APIの呼び出しに失敗しました:", e);
      setPredictionError(e instanceof Error ? e.message : '不明なエラーが発生しました');
    } finally {
      setIsPredicting(false);
    }
  };

  // --- UI描画 ---
  return (
    <main className="flex h-screen">
      <div className="w-1/4 p-4 overflow-y-auto bg-gray-100 flex flex-col">
        <h2 className="text-xl font-bold mb-4">操作パネル</h2>
        
        <div className="mb-4">
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

        {isLoading && <div className="mt-4">地図を読み込み中...</div>}
        {error && <div className="mt-4 text-red-500">エラー: {error}</div>}

        <hr className="my-4"/>

        <div className="flex-grow">
          <h3 className="text-lg font-bold mb-2">生育予測</h3>
          {selectedFeature ? (
            <div>
              <p className="text-sm mb-2">選択中圃場ID: <span className="font-mono bg-gray-200 px-1 rounded">{selectedFeatureId}</span></p>
              
              <div className="mb-2">
                <label className="block text-sm font-medium">移植日</label>
                <input type="date" value={transplantDate} onChange={e => setTransplantDate(e.target.value)} className="w-full p-2 border rounded mt-1" />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium">品種</label>
                <select value={variety} onChange={e => setVariety(e.target.value)} className="w-full p-2 border rounded mt-1">
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <button onClick={handlePredict} disabled={isPredicting} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
                {isPredicting ? '予測中...' : '予測を実行'}
              </button>

              {predictionError && <div className="mt-4 text-red-500">エラー: {predictionError}</div>}
              {predictionResult && (
                <div className="mt-4 p-2 bg-green-100 border border-green-300 rounded">
                  <h4 className="font-bold">予測結果</h4>
                  <p>出穂日: {predictionResult.heading_date}</p>
                  <p>成熟期: {predictionResult.maturity_date}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">地図上の圃場を選択してください。</p>
          )}
        </div>

      </div>
      <div className="flex-1">
        <Map 
          geoJsonData={geoJsonData} 
          selectedFeatureId={selectedFeatureId}
          onFeatureSelect={handleFeatureSelect}
        />
      </div>
    </main>
  );
}

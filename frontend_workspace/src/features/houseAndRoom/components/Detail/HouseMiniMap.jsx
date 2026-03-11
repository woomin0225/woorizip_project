import { useEffect, useRef } from 'react';
import styles from './HouseMiniMap.module.css';

export default function HouseMiniMap({ lat, lng }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const KAKAO_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!lat || !lng) return;
    if (!KAKAO_KEY) return;

    function init() {
      const kakao = window.kakao;
      const center = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(mapDivRef.current, { center, level: 4 });
      mapRef.current = map;

      const marker = new kakao.maps.Marker({ position: center });
      marker.setMap(map);
      markerRef.current = marker;
    }

    if (window.kakao && window.kakao.maps) { init(); return; }

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(init);
    document.head.appendChild(script);
  }, [KAKAO_KEY, lat, lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !window.kakao?.maps) return;
    if (!lat || !lng) return;

    const pos = new window.kakao.maps.LatLng(lat, lng);
    map.setCenter(pos);
    marker.setPosition(pos);
  }, [lat, lng]);

  if (!lat || !lng) return <div className={styles.empty}>위치 정보가 없습니다.</div>;
  return <div ref={mapDivRef} className={styles.map} />;
}
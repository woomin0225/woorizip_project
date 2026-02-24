import { useEffect, useRef } from "react";

export default function MapPanel({ markers = [], loadingMarkers, onChangeBbox }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerObjsRef = useRef([]);
  const debounceRef = useRef(null);

  const KAKAO_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!KAKAO_KEY) {
      console.warn("REACT_APP_KAKAO_MAP_KEY가 없습니다(.env 확인).");
      return;
    }

    function initMap() {
      const kakao = window.kakao;

      const center = new kakao.maps.LatLng(37.5547, 126.9706); // 서울역 근처
      const map = new kakao.maps.Map(mapDivRef.current, { center, level: 5 });
      mapRef.current = map;

      // bounds_changed에서 bbox를 부모(Search)에게 전달
      kakao.maps.event.addListener(map, "bounds_changed", () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
          const b = map.getBounds();
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();

          onChangeBbox({
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng(),
          });
        }, 250);
      });
    }

    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      initMap();
      return;
    }

    // 스크립트 로드
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);
  }, [KAKAO_KEY, onChangeBbox]);

  // markers가 바뀌면 지도에 다시 그림
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const kakao = window.kakao;

    // 기존 마커 제거
    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    markers.forEach((mk) => {
      // HouseMarkerResponse 필드명 그대로 사용
      const lat = mk.houseLat;
      const lng = mk.houseLng;
      if (lat == null || lng == null) return;

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        title: mk.houseName,
      });
      marker.setMap(map);
      markerObjsRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div style={{ position: "relative", height: 500 }}>
      <div ref={mapDivRef} style={{ height: "100%" }} />
      {loadingMarkers && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "white", padding: 6 }}>
          마커 로딩중...
        </div>
      )}
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styles from './MapPanel.module.css';

function MarkerPopup({ rooms, onClose }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 8,
      width: 260,
      maxHeight: 220,
      overflow: "auto",
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <b>방 목록</b>
        <button onClick={onClose}>X</button>
      </div>

      {rooms.length === 0 && <div style={{ fontSize: 13 }}>표시할 방이 없습니다.</div>}

      {rooms.map((r) => (
        <div key={r.roomNo} style={{ padding: "6px 0", borderTop: "1px solid #eee" }}>
          <Link to={`/rooms/${r.roomNo}`} onClick={onClose} style={{ textDecoration: "none" }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.roomName}</div>
            <div style={{ fontSize: 12, color: "#555" }}>
              {r.roomMethod} / {r.roomDeposit ?? 0} / {r.roomMonthly ?? 0}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function MapPanel({ markers = [],
    loadingMarkers,
    onChangeBbox,
    onMarkerClick,
    popup,
    onClosePopup, }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerObjsRef = useRef([]);
  const debounceRef = useRef(null);

  const overlayRef = useRef(null);
  const [overlayEl, setOverlayEl] = useState(null);

  const KAKAO_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!KAKAO_KEY) {
      console.warn("REACT_APP_KAKAO_MAP_KEY가 없습니다(.env 확인).");
      return;
    }

    function initMap() {
      // if (!mapRef.current) return;  // null 방지
      if (mapRef.current) return; // StrictMode useEffect 2번 실행 방지

      const kakao = window.kakao;

      const center = new kakao.maps.LatLng(37.5252, 126.9976);  // 서울 다 보이게
      const map = new kakao.maps.Map(mapDivRef.current, { center, level: 8 });  // 낮을수록 확대
      mapRef.current = map;

      // 지도 최초 렌더한 후 bound 잡기
      let fired = false;
      kakao.maps.event.addListener(map, "idle", () => {
        if(fired) return;
        fired = true;
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        onChangeBbox({
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        });
      });

      // 컨테이너 크기 계산 꼬임 방지(가끔 빈 화면 해결)
      setTimeout(() => {
        map.relayout();
        map.setCenter(center);
      }, 0);
      
      // 지도 안정화 후에 api 호출되도록. 잦은 호출 방지
      let timer = null;
      let lastBbox = null; // (선택) 동일 bbox 중복 방지

      kakao.maps.event.addListener(map, "idle", () => {
        if (timer) clearTimeout(timer);

        timer = setTimeout(() => {
          const b = map.getBounds();
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          const next = {
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng(),
          };

          // (선택) bbox가 거의 같으면 호출 안 함
          const same =
            lastBbox &&
            Math.abs(lastBbox.swLat - next.swLat) < 1e-6 &&
            Math.abs(lastBbox.swLng - next.swLng) < 1e-6 &&
            Math.abs(lastBbox.neLat - next.neLat) < 1e-6 &&
            Math.abs(lastBbox.neLng - next.neLng) < 1e-6;

          if (!same) {
            lastBbox = next;
            onChangeBbox(next);
          }
        }, 600); // ✅ 250 → 600~800ms 추천
      });
    }

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    script.onerror = () => console.error("카카오 지도 SDK 로드 실패 (키/도메인/네트워크 확인)");
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);
  }, [KAKAO_KEY, onChangeBbox, onClosePopup]);

  // markers 렌더 + 클릭 이벤트
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const kakao = window.kakao;

    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    markers.forEach((mk) => {
      const lat = mk.houseLat;
      const lng = mk.houseLng;
      if (lat == null || lng == null) return;

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        title: mk.houseName,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (onMarkerClick) {
          onMarkerClick({
            houseNo: mk.houseNo,
            houseLat: mk.houseLat,
            houseLng: mk.houseLng,
          });
        }
      });

      marker.setMap(map);
      markerObjsRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  // popup 변경 시 CustomOverlay 생성/제거
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const kakao = window.kakao;

    // 기존 오버레이 제거
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    setOverlayEl(null);

    if (!popup) return;

    const el = document.createElement("div");
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(popup.lat, popup.lng),
      content: el,
      yAnchor: 1.2,
      xAnchor: 0.5,
    });
    overlay.setMap(map);

    overlayRef.current = overlay;
    setOverlayEl(el);

    return () => {
      if (overlayRef.current) overlayRef.current.setMap(null);
      overlayRef.current = null;
      setOverlayEl(null);
    };
  }, [popup]);

  return (
    <div className={styles.mapWrap} id="map" style={{ position: "relative", height: 500 }}>
      <div ref={mapDivRef} style={{ width: "100%", height: "100%", background: "#f7f7f7" }} />

      {loadingMarkers && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "white", padding: 6 }}>
          마커 로딩중...
        </div>
      )}

      {/* 마커 위 팝업(Portal로 렌더링 -> Link 사용 가능) */}
      {overlayEl && popup && createPortal(
        <MarkerPopup rooms={popup.rooms || []} onClose={onClosePopup} />,
        overlayEl
      )}
    </div>
  );
}
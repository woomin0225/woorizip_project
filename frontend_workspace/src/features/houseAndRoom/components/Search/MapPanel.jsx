import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styles from './MapPanel.module.css';

function houseImgUrl(imageName) {
  if (!imageName) return null;
  if (imageName.startsWith('http')) return imageName;
  // ✅ 백엔드 경로에 맞게 필요하면 house_image 폴더명만 조정
  return `http://localhost:8080/upload/house_image/${imageName}`;
}

function MarkerPopup({ house, rooms, onClose }) {
  // console.log(house);
  const name = house?.houseName ?? '건물';
  const address =
    house?.houseAddressDetail
      ? `${house?.houseAddress ?? ''} ${house.houseAddressDetail}`
      : (house?.houseAddress ?? '');
console.log(house)
  const imgName =
    (Array.isArray(house?.imageNames) ? house.imageNames[0] : null)

  const imgSrc = houseImgUrl(imgName);

  return (
    <div style={{
      background: "white",
      border: "1px solid #ddd",
      borderRadius: 10,
      padding: 10,
      width: 300,
      maxHeight: 320,
      overflow: "auto",
      boxShadow: "0 6px 16px rgba(0,0,0,0.16)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>{name}</div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>✕</button>
      </div>

      <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.35 }}>
        {address || "주소 정보 없음"}
      </div>

      <div style={{ marginTop: 10 }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="건물 사진"
            style={{
              width: "100%",
              height: 140,
              objectFit: "cover",
              borderRadius: 10,
              background: "#f2f2f2"
            }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div style={{
            width: "100%",
            height: 140,
            borderRadius: 10,
            background: "#f2f2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            fontSize: 12
          }}>
            사진 없음
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ fontSize: 13 }}>방 목록</b>
      </div>

      {rooms.length === 0 && <div style={{ fontSize: 13, marginTop: 6 }}>표시할 방이 없습니다.</div>}

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

  const onChangeBboxRef = useRef(onChangeBbox);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onChangeBboxRef.current = onChangeBbox; }, [onChangeBbox]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

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
        onChangeBboxRef.current?.({
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
            onChangeBboxRef.current?.(next);
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
  }, [KAKAO_KEY]);

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
          onMarkerClickRef.current?.({
            houseNo: mk.houseNo,
            houseName: mk.houseName,
            houseAddress: mk.houseAddress,
            imageNames: mk.imageNames,
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
    const pos = new kakao.maps.LatLng(popup.lat, popup.lng);

    // ✅ 기본값(중앙 + 위로 뜨게)
    let xAnchor = 0.5;
    let yAnchor = 1.1;

    // ✅ 현재 지도 bounds 안에서 마커가 어느 위치에 있는지 비율로 계산
    try {
      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();

      const rx = (popup.lng - sw.getLng()) / (ne.getLng() - sw.getLng()); // 0(왼쪽) ~ 1(오른쪽)
      const ry = (popup.lat - sw.getLat()) / (ne.getLat() - sw.getLat()); // 0(아래) ~ 1(위)

      // ✅ 좌/우 끝이면 팝업이 “안쪽”으로 붙게
      if (rx < 0.25) xAnchor = 0.0;      // 마커 기준으로 오른쪽으로 펼쳐짐
      else if (rx > 0.75) xAnchor = 1.0; // 마커 기준으로 왼쪽으로 펼쳐짐
      else xAnchor = 0.5;

      // ✅ 위쪽 끝이면 아래로, 아래쪽 끝이면 위로
      if (ry > 0.75) yAnchor = 0.0;      // 마커 기준 아래로 펼쳐짐
      else yAnchor = 1.1;                // 기본: 위로 펼쳐짐

      // (선택) 너무 끝이면 살짝 가운데로 이동(팝업 잘림 방지)
      const needPan = rx < 0.12 || rx > 0.88 || ry < 0.12 || ry > 0.88;
      if (needPan) setTimeout(() => map.panTo(pos), 0);
    } catch (e) {
      // bounds 계산 실패해도 기본 anchor로 뜨게
    }

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content: el,
      xAnchor,
      yAnchor,
      clickable: true, // ✅ 팝업 안 링크 클릭 안정
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
    <div className={styles.mapWrap} id="map">
      <div ref={mapDivRef} style={{ width: "100%", height: "100%", background: "#f7f7f7" }} />

      {loadingMarkers && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "white", padding: 6 }}>
          마커 로딩중...
        </div>
      )}

      {/* 마커 위 팝업(Portal로 렌더링 -> Link 사용 가능) */}
      {overlayEl && popup && createPortal(
        <MarkerPopup rooms={popup.rooms || []} onClose={onClosePopup} house={popup.house}/>,
        overlayEl
      )}
    </div>
  );
}
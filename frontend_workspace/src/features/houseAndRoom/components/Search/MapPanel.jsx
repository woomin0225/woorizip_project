import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { buildUploadUrl } from '../../../../app/config/env';
import defaultMarkerIcon from '../../../../assets/images/map/marker-default.svg';
import activeMarkerIcon from '../../../../assets/images/map/marker-active.svg';
import styles from './MapPanel.module.css';

function createMarkerImage(kakao, src, size) {
  const width = size;
  const height = Math.round(size * 1.4);
  return new kakao.maps.MarkerImage(
    src,
    new kakao.maps.Size(width, height),
    {
      offset: new kakao.maps.Point(Math.round(width / 2), height),
    }
  );
}

function formatMoneyKRW(value) {
  if (value === null || value === undefined) return '';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);

  const EOK = 100_000_000;
  const MAN = 10_000;

  const eok = Math.floor(n / EOK);
  const rest = n % EOK;
  const man = Math.round(rest / MAN);

  if (eok > 0 && man > 0) return `${eok}억 ${man}만`;
  if (eok > 0) return `${eok}억`;
  return `${Math.round(n / MAN)}만`;
}

function houseImgUrl(imageName) {
  if (!imageName) return null;
  if (imageName.startsWith('http')) return imageName;
  return buildUploadUrl('upload/house_image', imageName);
}

function MarkerPopup({ house, rooms, onClose, onEnter, onLeave }) {
  const name = house?.houseName ?? '건물';
  const address = house?.houseAddressDetail
    ? `${house?.houseAddress ?? ''} ${house.houseAddressDetail}`
    : (house?.houseAddress ?? '');
  const imgName = Array.isArray(house?.imageNames) ? house.imageNames[0] : null;
  const imgSrc = houseImgUrl(imgName);

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onWheel={(e) => e.stopPropagation()}
      style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: 10,
        width: '100%',
        maxWidth: 360,
        maxHeight: '100%',
        overflow: 'auto',
        boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18 }}>{name}</div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          X
        </button>
      </div>

      <div
        style={{ fontSize: 14, color: '#555', marginTop: 4, lineHeight: 1.35 }}
      >
        {address || '주소 정보 없음'}
      </div>

      <div style={{ marginTop: 10 }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="건물 사진"
            style={{
              width: '100%',
              height: 150,
              objectFit: 'cover',
              borderRadius: 10,
              background: '#f2f2f2',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 140,
              borderRadius: 10,
              background: '#f2f2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: 12,
            }}
          >
            사진 없음
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <b style={{ fontSize: 13 }}>방 목록</b>
      </div>

      {rooms.length === 0 && (
        <div style={{ fontSize: 13, marginTop: 6 }}>표시할 방이 없습니다.</div>
      )}

      {rooms.map((r) => (
        <div
          key={r.roomNo}
          style={{ padding: '6px 0', borderTop: '1px solid #eee' }}
        >
          <Link
            to={`/rooms/${r.roomNo}`}
            onClick={onClose}
            style={{ textDecoration: 'none' }}
          >
            <div style={{ fontWeight: 600, fontSize: 18 }}>{r.roomName}</div>
            <div style={{ fontSize: 14, color: '#555' }}>
              {r.roomMethod === 'L' ? '전세' : '월세'}{' '}
              {r.roomDeposit
                ? `|보증금 ${formatMoneyKRW(r.roomDeposit)}원 `
                : ''}
              {r.roomMonthly ? `|월세:${formatMoneyKRW(r.roomMonthly)}원` : ''}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function MapPanel({
  markers = [],
  loadingMarkers,
  onChangeBbox,
  onMarkerClick,
  popup,
  onClosePopup,
  hoveredHouseNo,
}) {
  const onChangeBboxRef = useRef(onChangeBbox);
  const onMarkerClickRef = useRef(onMarkerClick);

  useEffect(() => {
    onChangeBboxRef.current = onChangeBbox;
  }, [onChangeBbox]);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerObjsRef = useRef([]);
  const KAKAO_KEY = process.env.REACT_APP_KAKAO_MAP_KEY;

  const disableMapWheelZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    if (typeof map.setZoomable === 'function') map.setZoomable(false);
  };

  const enableMapWheelZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    if (typeof map.setZoomable === 'function') map.setZoomable(true);
  };

  const handleClosePopup = () => {
    enableMapWheelZoom();
    onClosePopup?.();
  };

  useEffect(() => {
    if (!KAKAO_KEY) {
      console.warn('REACT_APP_KAKAO_MAP_KEY is missing.');
      return;
    }

    function initMap() {
      if (mapRef.current) return;

      const kakao = window.kakao;
      const center = new kakao.maps.LatLng(37.5252, 126.9976);
      const map = new kakao.maps.Map(mapDivRef.current, { center, level: 8 });
      mapRef.current = map;

      let fired = false;
      let timer = null;
      let lastBbox = null;
      let dragging = false;

      const emitBbox = () => {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        const next = {
          swLat: sw.getLat(),
          swLng: sw.getLng(),
          neLat: ne.getLat(),
          neLng: ne.getLng(),
        };

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
      };

      const scheduleEmit = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (dragging) return;
          emitBbox();
        }, 250);
      };

      kakao.maps.event.addListener(map, 'idle', () => {
        if (fired) return;
        fired = true;
        emitBbox();
      });

      setTimeout(() => {
        map.relayout();
        map.setCenter(center);
      }, 0);

      kakao.maps.event.addListener(map, 'dragstart', () => {
        dragging = true;
        if (timer) clearTimeout(timer);
      });

      kakao.maps.event.addListener(map, 'dragend', () => {
        dragging = false;
        scheduleEmit();
      });

      kakao.maps.event.addListener(map, 'zoom_changed', () => {
        if (dragging) return;
        scheduleEmit();
      });
    }

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    script.onerror = () => console.error('Kakao map SDK load failed.');
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);
  }, [KAKAO_KEY]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const kakao = window.kakao;
    const defaultMarkerImage = createMarkerImage(kakao, defaultMarkerIcon, 32);
    const activeMarkerImage = createMarkerImage(kakao, activeMarkerIcon, 40);
    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = [];

    markers.forEach((mk) => {
      const lat = mk.houseLat;
      const lng = mk.houseLng;
      if (lat == null || lng == null) return;
      const isHovered = hoveredHouseNo && String(mk.houseNo) === String(hoveredHouseNo);

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
        title: mk.houseName,
        image: isHovered ? activeMarkerImage : defaultMarkerImage,
      });
      marker.setZIndex(isHovered ? 10 : 1);

      kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClickRef.current?.({
          houseNo: mk.houseNo,
          houseName: mk.houseName,
          houseAddress: mk.houseAddress,
          houseAddressDetail: mk.houseAddressDetail,
          imageNames: mk.imageNames,
          houseLat: mk.houseLat,
          houseLng: mk.houseLng,
          rooms: mk.rooms,
        });
      });

      marker.setMap(map);
      markerObjsRef.current.push(marker);
    });
  }, [hoveredHouseNo, markers]);

  return (
    <div className={styles.mapWrap} id="map">
      <div
        ref={mapDivRef}
        style={{ width: '100%', height: '100%', background: '#f7f7f7' }}
      />

      {loadingMarkers && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'white',
            padding: 6,
          }}
        >
          마커 로딩중...
        </div>
      )}

      {popup && (
        <div className={styles.popupDock}>
          <MarkerPopup
            rooms={popup.rooms || []}
            house={popup.house}
            onClose={handleClosePopup}
            onEnter={disableMapWheelZoom}
            onLeave={enableMapWheelZoom}
          />
        </div>
      )}
    </div>
  );
}

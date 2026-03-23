export const SETTINGS_GUIDE =
  '접근성 설정에서는 음성 모드, 페이지 진입 시 자동 요약 읽기, 우리봇 답변 자동 읽기, 글자 크기를 조정할 수 있습니다.';

export const normalizeHouseContextItem = (house) => {
  const houseNo = String(house?.houseNo || '').trim();
  const houseName = String(house?.houseName || '').trim();
  if (!houseNo && !houseName) return null;
  return { houseNo, houseName };
};

export const isRoomCreateMessage = (value) =>
  /방\s*등록|방등록|매물\s*등록|매물등록|룸\s*등록|룸등록/.test(String(value || ''));

export const getRoomContext = (pathname = window.location.pathname) => {
  const roomMatch = String(pathname || '').match(/^\/rooms\/([^/]+)(?:\/(tour|contract))?$/);
  if (!roomMatch) return {};
  const tourLink = document.querySelector('a[href^="/rooms/"][href$="/tour"]');
  const href = tourLink?.getAttribute('href') || '';
  const hrefMatch = href.match(/^\/rooms\/([^/]+)\/tour$/);
  const roomNo = hrefMatch?.[1] || roomMatch?.[1] || '';
  const titleCandidates = Array.from(document.querySelectorAll('main h3, main h2'))
    .map((node) => String(node.textContent || '').replace(/^[^\p{L}\p{N}]+/gu, '').trim())
    .filter(Boolean);
  const roomName = titleCandidates.find((currentText) => !currentText.includes('위치') && !currentText.includes('공용시설') && !currentText.includes('방 옵션')) || '';
  if (!roomNo) return {};
  return { roomNo, roomName };
};

export const getRoomCreateContext = (location, managedHouses) => {
  const pathname = location.pathname || '';
  const roomCreateMatch = pathname.match(/^\/estate\/houses\/([^/]+)\/rooms\/new$/);
  const currentHouseNo = roomCreateMatch?.[1] || '';
  const currentHouseName = String(location?.state?.houseName || '').trim() || managedHouses.find((house) => house.houseNo === currentHouseNo)?.houseName || '';
  const availableHouses = managedHouses.filter((house) => house.houseNo || house.houseName);
  if (!currentHouseNo && availableHouses.length === 0) return {};
  const context = {};
  if (currentHouseNo || currentHouseName) context.currentHouse = { houseNo: currentHouseNo, houseName: currentHouseName };
  if (availableHouses.length > 0) context.availableHouses = availableHouses;
  return context;
};

export const getPageContext = () => {
  const sourceNode = document.querySelector('main') || document.body;
  const raw = sourceNode?.innerText || '';
  const normalized = raw.replace(/\s+/g, ' ').trim();
  return { url: window.location.href, title: document.title || '', contentExcerpt: normalized.slice(0, 2200) };
};

export const extractPostNoFromPath = (pathName = window.location.pathname) => {
  const patterns = [/\/notices\/(\d+)/, /\/events\/(\d+)/, /\/information\/(\d+)/, /\/boards\/(\d+)/];
  for (const pattern of patterns) {
    const match = pathName.match(pattern);
    if (match?.[1]) return Number(match[1]);
  }
  return null;
};

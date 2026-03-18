import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { runOrchestrateCommand } from '../api/orchestrateApi';
import { fetchBoardSummary } from '../../board/api/BoardSummaryApi';
import { getMyHouses } from '../../houseAndRoom/api/houseApi';
import botIcon from '../../../assets/images/ai_bot.png';
import { useAuth } from '../../../app/providers/AuthProvider';
import { parseJwt } from '../../../app/providers/utils/jwt';
import { useVoiceMode } from '../context/VoiceModeContext';
import styles from './OrchestrateQuickAgent.module.css';

function newSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ACTIONS = [
  {
    id: 'reserve',
    label: '예약',
    prompt: '공용시설 예약',
    aliases: ['시설예약', '공용시설예약', '예약하기'],
    related: ['facilityHours', 'reservationStatus', 'facilityCancel'],
    mode: 'direct',
  },
  {
    id: 'summary',
    label: '요약',
    prompt: '현재 페이지 요약',
    aliases: ['페이지요약', '내용요약', '설명요약'],
    related: ['roomRecommend', 'facilityInfo', 'reviews'],
    mode: 'direct',
  },
  {
    id: 'roomRecommend',
    label: '방 추천',
    prompt: '방 추천',
    aliases: ['방추천', '추천방', '인기방', '인기있는방보기'],
    related: ['availableRooms', 'deposit', 'monthlyRent'],
    mode: 'direct',
  },
  {
    id: 'facilityHours',
    label: '이용시간',
    prompt: '공용시설 이용시간',
    aliases: ['운영시간', '몇시까지', '시설시간'],
    related: ['reserve', 'facilityInfo', 'facilityCancel'],
    mode: 'direct',
  },
  {
    id: 'facilityCancel',
    label: '예약취소',
    prompt: '공용시설 예약 취소',
    aliases: ['취소', '예약취소', '시설취소'],
    related: ['reservationStatus', 'reserve', 'facilityHours'],
    mode: 'direct',
  },
  {
    id: 'facilityInfo',
    label: '시설안내',
    prompt: '공용시설 안내',
    aliases: ['시설정보', '시설안내', '공용시설'],
    related: ['reserve', 'facilityHours', 'gym'],
    mode: 'agent',
  },
  {
    id: 'gym',
    label: '헬스장',
    prompt: '헬스장 이용 안내',
    aliases: ['운동', '피트니스'],
    related: ['facilityInfo', 'reserve', 'facilityHours'],
    mode: 'agent',
  },
  {
    id: 'laundry',
    label: '세탁실',
    prompt: '세탁실 이용 안내',
    aliases: ['빨래', '세탁'],
    related: ['facilityInfo', 'facilityHours', 'reserve'],
    mode: 'agent',
  },
  {
    id: 'lounge',
    label: '라운지',
    prompt: '라운지 이용 안내',
    aliases: ['공용라운지', '휴게실'],
    related: ['facilityInfo', 'facilityHours', 'reserve'],
    mode: 'agent',
  },
  {
    id: 'studyRoom',
    label: '스터디룸',
    prompt: '스터디룸 이용 안내',
    aliases: ['공부방', '스터디'],
    related: ['reserve', 'facilityHours', 'facilityInfo'],
    mode: 'agent',
  },
  {
    id: 'reservationStatus',
    label: '예약내역',
    prompt: '예약 내역 확인',
    aliases: ['예약현황', '내예약', '예약목록'],
    related: ['facilityCancel', 'reserve', 'facilityHours'],
    mode: 'direct',
  },
  {
    id: 'availableRooms',
    label: '빈방',
    prompt: '현재 빈방 안내',
    aliases: ['공실', '입주가능방', '남은방'],
    related: ['roomRecommend', 'deposit', 'monthlyRent'],
    mode: 'agent',
  },
  {
    id: 'moveIn',
    label: '입주',
    prompt: '입주 절차 안내',
    aliases: ['입주절차', '체크인'],
    related: ['contract', 'deposit', 'tour'],
    mode: 'agent',
  },
  {
    id: 'moveOut',
    label: '퇴실',
    prompt: '퇴실 절차 안내',
    aliases: ['퇴거', '체크아웃'],
    related: ['contract', 'rules', 'contact'],
    mode: 'agent',
  },
  {
    id: 'deposit',
    label: '보증금',
    prompt: '보증금 안내',
    aliases: ['디파짓', '계약금'],
    related: ['monthlyRent', 'contract', 'roomRecommend'],
    mode: 'agent',
  },
  {
    id: 'monthlyRent',
    label: '월세',
    prompt: '월세 안내',
    aliases: ['임대료', '관리비'],
    related: ['deposit', 'roomRecommend', 'availableRooms'],
    mode: 'agent',
  },
  {
    id: 'wishlist',
    label: '찜',
    prompt: '찜한 방 확인',
    aliases: ['위시리스트', '좋아요'],
    related: ['roomRecommend', 'availableRooms', 'reviews'],
    mode: 'agent',
  },
  {
    id: 'contract',
    label: '계약',
    prompt: '계약 관련 안내',
    aliases: ['전자계약', '계약서'],
    related: ['deposit', 'moveIn', 'moveOut'],
    mode: 'agent',
  },
  {
    id: 'tour',
    label: '투어',
    prompt: '투어 신청 안내',
    aliases: ['방보러가기', '방투어'],
    related: ['roomRecommend', 'availableRooms', 'moveIn'],
    mode: 'agent',
  },
  {
    id: 'reviews',
    label: '후기',
    prompt: '후기 요약 안내',
    aliases: ['리뷰', '평가'],
    related: ['roomRecommend', 'summary', 'facilityInfo'],
    mode: 'agent',
  },
  {
    id: 'roomOptions',
    label: '옵션',
    prompt: '방 옵션 안내',
    aliases: ['옵션정보', '가구', '가전'],
    related: ['roomRecommend', 'availableRooms', 'deposit'],
    mode: 'agent',
  },
  {
    id: 'location',
    label: '위치',
    prompt: '위치 안내',
    aliases: ['주소', '교통', '주변'],
    related: ['roomRecommend', 'tour', 'facilityInfo'],
    mode: 'agent',
  },
  {
    id: 'contact',
    label: '문의',
    prompt: '문의 방법 안내',
    aliases: ['연락', '문의하기', '상담'],
    related: ['contract', 'moveIn', 'moveOut'],
    mode: 'agent',
  },
  {
    id: 'rules',
    label: '규정',
    prompt: '이용 규정 안내',
    aliases: ['정책', '규칙', '유의사항'],
    related: ['facilityInfo', 'moveOut', 'contract'],
    mode: 'agent',
  },
];

const STARTER_ACTION_IDS = ['reserve', 'summary', 'roomRecommend'];
const VOICE_CONFIRM_ACTIONS = new Set(['reserve', 'facilityCancel']);
const YES_TOKENS = ['예', '네', '응', '맞아', '좋아', '확인', '진행'];
const NO_TOKENS = ['아니오', '아니', '취소', '중지', '그만', '싫어'];

const ACTION_MAP = ACTIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

const uniqActionIds = (ids) => {
  const seen = new Set();
  return ids.filter((id) => ACTION_MAP[id] && !seen.has(id) && seen.add(id));
};

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');
const getActionTokens = (action) =>
  [action.label, action.prompt, ...(action.aliases || [])]
    .map(normalizeText)
    .filter(Boolean);
const getDirectTriggerTokens = (action) =>
  [action.label, ...(action.aliases || [])].map(normalizeText).filter(Boolean);

const matchActionIds = (value, options = {}) => {
  const text = normalizeText(value);
  if (!text) return [];

  return ACTIONS.map((action) => {
    if (options.directOnly && action.mode !== 'direct')
      return { id: action.id, score: 0 };
    const score = getActionTokens(action).reduce((max, token) => {
      if (!token || !text.includes(token)) return max;
      return Math.max(max, token.length);
    }, 0);
    return { id: action.id, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.id);
};

const detectQuickAction = (value) => {
  const text = normalizeText(value);
  if (!text) return null;

  return (
    ACTIONS.find((action) =>
      getDirectTriggerTokens(action).some((token) => token === text)
    )?.id || null
  );
};
const suggestActionsFromText = (value) => matchActionIds(value);

const expandRelatedActionIds = (ids, limit = 3) => {
  const selected = uniqActionIds(ids);
  const result = [...selected];

  for (let i = 0; i < selected.length && result.length < limit; i += 1) {
    const current = ACTION_MAP[selected[i]];
    (current?.related || []).forEach((relatedId) => {
      if (
        result.length < limit &&
        ACTION_MAP[relatedId] &&
        !result.includes(relatedId)
      ) {
        result.push(relatedId);
      }
    });
  }

  return result.slice(0, limit);
};

const isYes = (value) =>
  YES_TOKENS.some((token) =>
    normalizeText(value).includes(normalizeText(token))
  );
const isNo = (value) =>
  NO_TOKENS.some((token) =>
    normalizeText(value).includes(normalizeText(token))
  );

const formatAssistantReply = (value) => {
  const source = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (!source) return '';

  let formatted = source.replace(/\s*(\d+\.)\s*/g, '\n$1 ');
  formatted = formatted.replace(/\n{2,}/g, '\n').trim();

  if (!formatted.includes('\n')) {
    formatted = formatted.replace(/([.!?]|\uB2C8\uB2E4\.|\uC138\uC694\.|\uD574\uC8FC\uC138\uC694\.|\uB429\uB2C8\uB2E4\.)\s+(?=[^\n])/g, '$1\n');
    formatted = formatted.replace(/\n{2,}/g, '\n').trim();
  }

  return formatted;
};

const normalizeHouseContextItem = (house) => {
  const houseNo = String(house?.houseNo || '').trim();
  const houseName = String(house?.houseName || '').trim();
  if (!houseNo && !houseName) return null;
  return { houseNo, houseName };
};

const SETTINGS_GUIDE = '접근성 설정에서는 음성 모드, 페이지 진입 시 자동 요약 읽기, 현재 포커스 요소 읽기, 우리봇 답변 자동 읽기, 음성 명령 사용, 글자 크기, 페이지 배율, 버튼 크기를 조정할 수 있습니다.';

export default function OrchestrateQuickAgent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, userId } = useAuth();
  const {
    voiceModeEnabled,
    listening,
    speaking,
    settings,
    isSpeechRecognitionSupported,
    enableVoiceMode,
    disableVoiceMode,
    speak,
    startListening,
    stopListening,
    updateSetting,
  } = useVoiceMode();

  const bottomRef = useRef(null);
  const lastSpokenMessageRef = useRef('');
  const voiceGuideShownRef = useRef(false);
  const voiceLoopStateRef = useRef({ voiceModeEnabled, settings, loading: false, speaking: false });
  const userDisplayName = useMemo(() => {
    const payload = parseJwt(accessToken);
    const rawName =
      payload?.name ||
      payload?.userName ||
      payload?.nickname ||
      payload?.preferred_username;
    if (rawName) return String(rawName).trim();
    if (userId) return String(userId).split('@')[0].trim();
    return '고객';
  }, [accessToken, userId]);

  const greetingText = useMemo(
    () =>
      `안녕하세요! 저는 ${userDisplayName} 님만을 위한 비서 우리봇이에요! 도움이 필요하거나 궁금한 것이 있다면 아래 대화창에 입력해주세요!`,
    [userDisplayName]
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [managedHouses, setManagedHouses] = useState([]);
  const [managedHousesLoaded, setManagedHousesLoaded] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: greetingText, actionIds: STARTER_ACTION_IDS },
  ]);
  const [sessionId] = useState(newSessionId);

  useEffect(() => {
    voiceLoopStateRef.current = {
      voiceModeEnabled,
      settings,
      loading,
      speaking,
    };
  }, [voiceModeEnabled, settings, loading, speaking]);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);
  const latestAssistant = useMemo(
    () =>
      [...messages].reverse().find((msg) => msg.role === 'assistant') || null,
    [messages]
  );
  const latestAssistantMessage = latestAssistant?.text || '';
  const voiceStatusText = listening
    ? '듣는 중입니다. 약 2초 정도 멈추면 자동으로 처리합니다.'
    : speaking
      ? '답변을 읽는 중입니다.'
      : loading
        ? '요청을 처리하고 있습니다.'
        : '대기 중입니다. 음성 모드에서는 자동으로 다시 듣기를 시작합니다.';

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open]);

  useEffect(() => {
    if (!open || managedHousesLoaded) return undefined;

    let cancelled = false;

    (async () => {
      try {
        // 방 등록처럼 "내가 가진 건물 중 어디에 넣을지"를 묻는 흐름을 위해
        // 챗봇이 열렸을 때 소유 건물 목록을 한 번 받아 두고 컨텍스트로 재사용한다.
        const houses = await getMyHouses();
        if (cancelled) return;
        setManagedHouses(
          Array.isArray(houses)
            ? houses.map(normalizeHouseContextItem).filter(Boolean)
            : []
        );
      } catch {
        if (!cancelled) {
          setManagedHouses([]);
        }
      } finally {
        if (!cancelled) {
          setManagedHousesLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [managedHousesLoaded, open]);

  useEffect(() => {
    if (voiceModeEnabled) {
      setOpen(true);
      if (!voiceGuideShownRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              '\uC74C\uC131 \uBAA8\uB4DC\uAC00 \uCF1C\uC84C\uC2B5\uB2C8\uB2E4. \uACC4\uC18D \uB9D0\uC500\uD558\uC2DC\uBA74 \uC6B0\uB9AC\uBD07\uC774 \uC790\uB3D9\uC73C\uB85C \uB4E3\uACE0 \uB2F5\uBCC0\uD569\uB2C8\uB2E4. \uD544\uC694\uD558\uBA74 \uC544\uB798 \uC785\uB825\uCC3D\uC73C\uB85C \uD55C \uBC88 \uB354 \uC548\uB0B4\uB97C \uB0A8\uAE38 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4.',
            actionIds: ['summary', 'roomRecommend', 'reserve'],
          },
        ]);
        voiceGuideShownRef.current = true;
      }
      return;
    }

    voiceGuideShownRef.current = false;
  }, [voiceModeEnabled]);

  useEffect(() => {
    if (!voiceModeEnabled || !settings.autoReadBotReplies || !latestAssistant) {
      return;
    }

    const suggestionText =
      Array.isArray(latestAssistant.actionIds) && latestAssistant.actionIds.length > 0
        ? ` \uCD94\uCC9C \uBA85\uB839\uC740 ${latestAssistant.actionIds
            .map((id) => ACTION_MAP[id]?.label)
            .filter(Boolean)
            .join(', ')} \uC785\uB2C8\uB2E4.`
        : '';
    const speechText = `${latestAssistant.text.replace(/\n/g, ' ')}${suggestionText}`.trim();
    if (!speechText || speechText === lastSpokenMessageRef.current) return;
    lastSpokenMessageRef.current = speechText;
    speak(speechText);
  }, [voiceModeEnabled, settings.autoReadBotReplies, latestAssistant, speak]);

  const getRoomContext = () => {
    const pathname = location.pathname || '';
    const isRoomDetailPage = /^\/rooms\/[^/]+$/.test(pathname);
    if (!isRoomDetailPage) return {};

    const tourLink = document.querySelector('a[href^="/rooms/"][href$="/tour"]');
    const href = tourLink?.getAttribute('href') || '';
    const hrefMatch = href.match(/^\/rooms\/([^/]+)\/tour$/);
    const pathMatch = pathname.match(/^\/rooms\/([^/]+)$/);
    const roomNo = hrefMatch?.[1] || pathMatch?.[1] || '';

    const titleCandidates = Array.from(document.querySelectorAll('main h3, main h2'))
      .map((node) => String(node.textContent || '').replace(/^[^\p{L}\p{N}]+/gu, '').trim())
      .filter(Boolean);
    const roomName =
      titleCandidates.find(
        (currentText) =>
          !currentText.includes('\uC704\uCE58') &&
          !currentText.includes('\uACF5\uC6A9\uC2DC\uC124') &&
          !currentText.includes('\uBC29 \uC635\uC158')
      ) || '';

    if (!roomNo) return {};

    return { roomNo, roomName };
  };

  const getRoomCreateContext = () => {
    const pathname = location.pathname || '';
    const roomCreateMatch = pathname.match(/^\/estate\/houses\/([^/]+)\/rooms\/new$/);
    const currentHouseNo = roomCreateMatch?.[1] || '';
    const currentHouseName =
      String(location?.state?.houseName || '').trim() ||
      managedHouses.find((house) => house.houseNo === currentHouseNo)?.houseName ||
      '';
    const availableHouses = managedHouses.filter(
      (house) => house.houseNo || house.houseName
    );

    if (!currentHouseNo && availableHouses.length === 0) {
      return {};
    }

    // 백엔드에서는 houseNo로 등록하지만, 사용자 경험은 houseName 기준이 더 자연스럽다.
    // 그래서 현재 선택 건물과 전체 후보 건물 목록을 구조화해서 함께 보낸다.
    const context = {};
    if (currentHouseNo || currentHouseName) {
      context.currentHouse = {
        houseNo: currentHouseNo,
        houseName: currentHouseName,
      };
    }
    if (availableHouses.length > 0) {
      context.availableHouses = availableHouses;
    }
    return context;
  };

  const getPageContext = () => {
    const sourceNode = document.querySelector('main') || document.body;
    const raw = sourceNode?.innerText || '';
    const normalized = raw.replace(/\s+/g, ' ').trim();
    const contentExcerpt = normalized.slice(0, 2200);

    return {
      url: window.location.href,
      title: document.title || '',
      contentExcerpt,
    };
  };

  const extractPostNoFromPath = () => {
    const pathName = window.location.pathname;
    const patterns = [
      /\/notices\/(\d+)/,
      /\/events\/(\d+)/,
      /\/information\/(\d+)/,
      /\/boards\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = pathName.match(pattern);
      if (match?.[1]) {
        return Number(match[1]);
      }
    }

    return null;
  };

  const appendAssistantMessage = (messageText, actionIds = []) => {
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: messageText, actionIds: uniqActionIds(actionIds) },
    ]);
  };

  const openAccessibilitySettings = () => {
    window.dispatchEvent(new Event('woorizip:open-accessibility-settings'));
  };

  const goToPage = (pathName, messageText, actionIds = []) => {
    navigate(pathName);
    appendAssistantMessage(messageText, actionIds);
  };

  const runQuickAction = async (actionId, options = {}) => {
    const action = ACTION_MAP[actionId];
    if (!action) return;

    if (
      voiceModeEnabled &&
      !options.skipConfirm &&
      VOICE_CONFIRM_ACTIONS.has(actionId)
    ) {
      setPendingConfirmation({ actionId, label: action.label });
      appendAssistantMessage(
        `${action.label}\uC744 \uC9C4\uD589\uD560\uAE4C\uC694? \uC608 \uB610\uB294 \uC544\uB2C8\uC624\uB85C \uB9D0\uC500\uD574 \uC8FC\uC138\uC694.`,
        expandRelatedActionIds(action.related || [], 3)
      );
      return;
    }

    if (actionId === 'reserve') {
      goToPage(
        '/reservation/view',
        '\uC608\uC57D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uC6D0\uD558\uC2DC\uB294 \uC2DC\uC124\uACFC \uC2DC\uAC04\uC744 \uC120\uD0DD\uD574\uC8FC\uC138\uC694.',
        ['facilityHours', 'reservationStatus', 'facilityCancel']
      );
      return;
    }

    if (actionId === 'roomRecommend') {
      goToPage(
        '/rooms',
        '\uBC29 \uCD94\uCC9C\uC744 \uD655\uC778\uD560 \uC218 \uC788\uB3C4\uB85D \uBC29 \uBAA9\uB85D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4.',
        ['availableRooms', 'deposit', 'monthlyRent']
      );
      return;
    }

    if (actionId === 'summary') {
      const postNo = extractPostNoFromPath();

      if (!postNo) {
        const page = getPageContext();
        const excerpt = (page.contentExcerpt || '').slice(0, 220);
        appendAssistantMessage(
          `\uD604\uC7AC \uD398\uC774\uC9C0\uB294 \uAC8C\uC2DC\uAE00 \uC0C1\uC138\uD398\uC774\uC9C0\uAC00 \uC544\uB2C8\uC5B4\uC11C \uBCF8\uBB38 \uAE30\uC900 \uAC04\uB2E8 \uC694\uC57D\uB9CC \uC81C\uACF5\uD569\uB2C8\uB2E4.\n\uC81C\uBAA9: ${page.title || '-'}\n\uC694\uC57D: ${excerpt || '\uC694\uC57D\uD560 \uBCF8\uBB38\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.'}`,
          ['roomRecommend', 'reviews', 'facilityInfo']
        );
        return;
      }

      try {
        setLoading(true);
        const response = await fetchBoardSummary(postNo);
        const result = response?.data?.data ?? response?.data;

        const summaryText = String(result?.summary || '\uC694\uC57D \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.').trim();
        const keyPoints = Array.isArray(result?.keyPoints)
          ? result.keyPoints
              .map((item) => String(item || '').replace(/^[-\u2022\s]+/, '').trim())
              .filter(Boolean)
          : [];
        const conclusion = String(result?.conclusion || '').trim();
        const warnings = Array.isArray(result?.warnings)
          ? result.warnings
              .map((item) => String(item || '').replace(/^[-\u2022\s]+/, '').trim())
              .filter(Boolean)
          : [];

        const sections = ['\uAC8C\uC2DC\uAE00 AI \uC694\uC57D\uC785\uB2C8\uB2E4.'];
        if (summaryText) sections.push(`\uC694\uC57D\n${summaryText}`);
        if (keyPoints.length > 0) sections.push(`\uD575\uC2EC\n\u2022 ${keyPoints.join('\n\u2022 ')}`);
        if (conclusion) sections.push(`\uACB0\uB860\n${conclusion}`);
        if (warnings.length > 0) sections.push(`\uCC38\uACE0\n\u2022 ${warnings.join('\n\u2022 ')}`);

        appendAssistantMessage(sections.join('\n\n'), [
          'roomRecommend',
          'reviews',
          'facilityInfo',
        ]);
      } catch (error) {
        const errorBody = error?.response?.data;
        const apiMessage =
          errorBody?.data ||
          errorBody?.message ||
          errorBody?.error ||
          error?.message ||
          '\uAC8C\uC2DC\uAE00 \uC694\uC57D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.';

        appendAssistantMessage(`\uC624\uB958: ${apiMessage}`, [
          'roomRecommend',
          'reviews',
          'facilityInfo',
        ]);
      } finally {
        setLoading(false);
      }

      return;
    }

    if (actionId === 'facilityHours') {
      goToPage(
        '/facility/view',
        '\uC774\uC6A9\uC2DC\uAC04 \uD655\uC778\uC744 \uC704\uD574 \uC2DC\uC124 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uC2DC\uC124\uC744 \uC120\uD0DD\uD558\uBA74 \uC6B4\uC601\uC2DC\uAC04\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
        ['reserve', 'facilityInfo', 'facilityCancel']
      );
      return;
    }

    if (actionId === 'facilityCancel') {
      goToPage(
        '/reservation/view',
        '\uC608\uC57D \uB0B4\uC5ED \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uCDE8\uC18C\uD560 \uC608\uC57D\uC744 \uC120\uD0DD\uD574 \uC9C4\uD589\uD574\uC8FC\uC138\uC694.',
        ['reservationStatus', 'reserve', 'facilityHours']
      );
      return;
    }

    if (actionId === 'reservationStatus') {
      goToPage(
        '/reservation/view',
        '\uC608\uC57D \uB0B4\uC5ED \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uC608\uC57D \uC0C1\uD0DC\uB97C \uD655\uC778\uD574\uBCF4\uC138\uC694.',
        ['facilityCancel', 'reserve', 'facilityHours']
      );
    }
  };

  const handleLocalSystemCommand = (messageText) => {
    const normalized = normalizeText(messageText);
    if (!normalized) return false;

    if (
      normalized.includes('\uC811\uADFC\uC131\uC124\uC815') ||
      normalized.includes('\uC124\uC815\uBC14\uAFB8\uACE0\uC2F6') ||
      normalized.includes('\uC124\uC815\uC5F4\uC5B4') ||
      normalized.includes('\uC124\uC815\uC124\uBA85')
    ) {
      openAccessibilitySettings();
      appendAssistantMessage(`\uC811\uADFC\uC131 \uC124\uC815\uC744 \uC5F4\uC5C8\uC2B5\uB2C8\uB2E4.\n${SETTINGS_GUIDE}`);
      return true;
    }

    if (
      (normalized.includes('\uD398\uC774\uC9C0\uC694\uC57D') || normalized.includes('\uC790\uB3D9\uC694\uC57D')) &&
      (normalized.includes('\uCF1C') || normalized.includes('on') || normalized.includes('\uD65C\uC131\uD654'))
    ) {
      updateSetting('autoReadPageSummary', true);
      appendAssistantMessage(
        '\uD398\uC774\uC9C0 \uC9C4\uC785 \uC2DC \uC790\uB3D9 \uC694\uC57D \uC77D\uAE30\uB97C \uCF30\uC2B5\uB2C8\uB2E4. \uC774\uC81C \uD398\uC774\uC9C0\uB97C \uC774\uB3D9\uD560 \uB54C\uB9C8\uB2E4 \uD575\uC2EC \uB0B4\uC6A9\uC744 \uBA3C\uC800 \uC77D\uC5B4\uB4DC\uB9BD\uB2C8\uB2E4.'
      );
      return true;
    }

    if (
      (normalized.includes('\uD398\uC774\uC9C0\uC694\uC57D') || normalized.includes('\uC790\uB3D9\uC694\uC57D')) &&
      (normalized.includes('\uAEBC') || normalized.includes('off') || normalized.includes('\uBE44\uD65C\uC131\uD654'))
    ) {
      updateSetting('autoReadPageSummary', false);
      appendAssistantMessage(
        '\uD398\uC774\uC9C0 \uC9C4\uC785 \uC2DC \uC790\uB3D9 \uC694\uC57D \uC77D\uAE30\uB97C \uAFB8\uC2B5\uB2C8\uB2E4. \uD544\uC694\uD560 \uB54C\uB9CC \uC694\uC57D\uC744 \uC694\uCCAD\uD574 \uC8FC\uC138\uC694.'
      );
      return true;
    }

    if (normalized.includes('\uACF5\uC9C0\uC0AC\uD56D') || normalized === '\uACF5\uC9C0' || normalized.includes('\uACF5\uC9C0\uD398\uC774\uC9C0')) {
      goToPage(
        '/notices',
        '\uACF5\uC9C0\uC0AC\uD56D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uCD5C\uC2E0 \uACF5\uC9C0\uC640 \uC6B4\uC601 \uC548\uB0B4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
        ['summary']
      );
      return true;
    }

    if (normalized.includes('\uBC29\uCC3E\uAE30') || normalized.includes('\uBC29\uBCF4\uC5EC\uC918') || normalized.includes('\uBC29\uBAA9\uB85D')) {
      goToPage(
        '/rooms',
        '\uBC29 \uBAA9\uB85D \uD398\uC7740C0C',
        ['roomRecommend', 'summary']
      );
      return true;
    }

    if (normalized.includes('\uACF5\uC6A9\uC2DC\uC124') || normalized.includes('\uC2DC\uC124\uD398\uC774\uC9C0') || normalized === '\uC2DC\uC124\uC548\uB0B4') {
      goToPage(
        '/facility/view',
        '\uACF5\uC6A9\uC2DC\uC124 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uC2DC\uC124 \uC548\uB0B4\uC640 \uC608\uC57D \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
        ['facilityHours', 'reserve']
      );
      return true;
    }

    if (normalized.includes('\uC608\uC57D\uB0B4\uC5ED') || normalized.includes('\uC608\uC57D\uD398\uC774\uC9C0') || normalized.includes('\uC608\uC57D\uD655\uC778')) {
      goToPage(
        '/reservation/view',
        '\uC608\uC57D \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uD604\uC7AC \uC608\uC57D \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uAC70\uB098 \uC608\uC57D\uC744 \uC9C4\uD589\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
        ['reserve', 'facilityCancel']
      );
      return true;
    }

    if (normalized === '\uD648' || normalized.includes('\uD648\uC73C\uB85C\uAC00')) {
      goToPage(
        '/',
        '\uD648\uC73C\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uC8FC\uC694 \uBA54\uB274\uC640 \uC11C\uBE44\uC2A4 \uC548\uB0B4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
        ['summary']
      );
      return true;
    }

    if (normalized.includes('\uD604\uC7AC\uD398\uC774\uC9C0\uC694\uC57D') || normalized === '\uC694\uC57D\uD574\uC918' || normalized === '\uC694\uC57D') {
      void runQuickAction('summary', { skipConfirm: true });
      return true;
    }

    return false;
  };

  const extractSuggestedActions = (result) => {
    const picked = [];
    const add = (id) => {
      if (ACTION_MAP[id] && !picked.includes(id)) picked.push(id);
    };
    const addMatches = (value) => {
      suggestActionsFromText(value).forEach(add);
    };

    const fromResponse = result?.suggestedActions;
    if (Array.isArray(fromResponse)) {
      fromResponse.forEach((item) => addMatches(item?.id || item?.label || item));
    }

    addMatches(result?.intent || '');
    addMatches(result?.action?.name || '');

    return expandRelatedActionIds(picked, 3);
  };

  const resolveConfirmation = async (messageText) => {
    if (!pendingConfirmation) return false;

    if (isYes(messageText)) {
      const actionId = pendingConfirmation.actionId;
      setPendingConfirmation(null);
      appendAssistantMessage(
        `${ACTION_MAP[actionId]?.label || '\uC694\uCCAD'}\uC744 \uACC4\uC18D \uC9C4\uD589\uD569\uB2C8\uB2E4.`,
        expandRelatedActionIds([actionId], 3)
      );
      void runQuickAction(actionId, { skipConfirm: true });
      return true;
    }

    if (isNo(messageText)) {
      const actionId = pendingConfirmation.actionId;
      setPendingConfirmation(null);
      appendAssistantMessage(
        `${ACTION_MAP[actionId]?.label || '\uC694\uCCAD'}\uC744 \uCDE8\uC18C\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uBA85\uB839\uC744 \uB9D0\uC500\uD574 \uC8FC\uC138\uC694.`,
        ['summary', 'roomRecommend', 'reserve']
      );
      return true;
    }

    appendAssistantMessage(
      '\uC7AC\uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. \uC608 \uB610\uB294 \uC544\uB2C8\uC624\uB85C \uB9D0\uC500\uD574 \uC8FC\uC138\uC694.',
      ['reserve', 'facilityCancel', 'summary']
    );
    return true;
  };

  const sendMessage = async (rawText, options = {}) => {
    const messageText = String(rawText || '').trim();
    if (!messageText || loading) return;

    const displayText = options.displayText || messageText;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: displayText }]);

    if (await resolveConfirmation(messageText)) {
      return;
    }

    if (handleLocalSystemCommand(messageText)) {
      return;
    }

    const quickAction = options.skipQuickAction ? null : detectQuickAction(messageText);
    if (quickAction) {
      void runQuickAction(quickAction);
      return;
    }

    setLoading(true);

    try {
      const roomContext = getRoomContext();
      const roomCreateContext = getRoomCreateContext();
      const result = await runOrchestrateCommand({
        text: messageText,
        sessionId,
        context: {
          path: window.location.pathname,
          ...roomContext,
          ...roomCreateContext,
          pageSnapshot: getPageContext(),
          siteProfile: {
            serviceName: '\uC6B0\uB9AC\uC9D1',
            channel: 'web',
            language: 'ko-KR',
            voiceMode: voiceModeEnabled,
          },
        },
      });

      const reply =
        result?.reply ||
        result?.outputText ||
        result?.message ||
        result?.result ||
        '\uC751\uB2F5\uC740 \uBC1B\uC558\uC9C0\uB9CC \uD45C\uC2DC \uAC00\uB2A5\uD55C \uBA54\uC2DC\uC9C0 \uD544\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.';
      const normalizedIntent = String(result?.intent || '').toUpperCase();

      if (normalizedIntent === 'SUMMARY') {
        await runQuickAction('summary', { skipConfirm: true });
        return;
      }

      const actionIds = extractSuggestedActions(result);
      const formattedReply = formatAssistantReply(String(reply));
      appendAssistantMessage(formattedReply, actionIds);

      if (voiceModeEnabled && result?.requiresConfirm && actionIds.length > 0) {
        setPendingConfirmation({
          actionId: actionIds[0],
          label: ACTION_MAP[actionIds[0]]?.label,
        });
        appendAssistantMessage(
          `${ACTION_MAP[actionIds[0]]?.label || '\uB2E4\uC74C \uC791\uC5C5'}\uC744 \uC774\uC5B4\uC11C \uC9C4\uD589\uD560\uAE4C\uC694? \uC608 \uB610\uB294 \uC544\uB2C8\uC624\uB85C \uB9D0\uC500\uD574 \uC8FC\uC138\uC694.`,
          actionIds
        );
      }
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage =
        errorBody?.data ||
        errorBody?.message ||
        errorBody?.error ||
        error?.message ||
        'Agent \uD638\uCD9C \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.';
      appendAssistantMessage(`\uC624\uB958: ${apiMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const onQuickActionClick = (actionId) => {
    const action = ACTION_MAP[actionId];
    if (!action || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: action.label }]);
    void runQuickAction(actionId);
  };

  const startVoiceCommand = (options = {}) => {
    const { quiet = false, retryOnEmpty = false } = options;

    if (!voiceModeEnabled) {
      enableVoiceMode();
      return;
    }

    if (!settings.voiceCommandEnabled) {
      appendAssistantMessage(
        '\uC74C\uC131 \uBA85\uB839\uC774 \uAEBC\uC838 \uC788\uC2B5\uB2C8\uB2E4. \uC811\uADFC\uC131 \uC124\uC815\uC5D0\uC11C \uC74C\uC131 \uBA85\uB839 \uC0AC\uC6A9\uC744 \uCF1C \uC8FC\uC138\uC694.'
      );
      return;
    }

    if (!isSpeechRecognitionSupported) {
      appendAssistantMessage(
        '\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C\uB294 \uC74C\uC131 \uC778\uC2DD\uC744 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uD14D\uC2A4\uD2B8 \uC785\uB825\uC744 \uC0AC\uC6A9\uD574 \uC8FC\uC138\uC694.'
      );
      return;
    }

    if (!quiet) {
      speak('\uB9D0\uC500\uD574 \uC8FC\uC138\uC694. \uC57D 2\uCD08 \uC815\uB3C4 \uBA48\uCD94\uBA74 \uC790\uB3D9\uC73C\uB85C \uCC98\uB9AC\uD569\uB2C8\uB2E4.');
    }

    let hasResult = false;

    startListening({
      onResult: (transcript) => {
        hasResult = true;
        if (!transcript) {
          if (!retryOnEmpty) {
            appendAssistantMessage(
              '\uC74C\uC131 \uC785\uB825\uC744 \uC778\uC2DD\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB9D0\uC500\uD574 \uC8FC\uC138\uC694.',
              ['summary', 'roomRecommend', 'reserve']
            );
          }
          return;
        }
        void sendMessage(transcript, { displayText: `\uC74C\uC131: ${transcript}` });
      },
      onError: (event) => {
        const errorType = event?.error || event?.message || '';
        if (errorType === 'no-speech' || errorType === 'aborted') {
          return;
        }
        appendAssistantMessage(
          '\uC74C\uC131 \uC785\uB825 \uC911 \uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.',
          ['summary', 'roomRecommend', 'reserve']
        );
      },
      onEnd: () => {
        const current = voiceLoopStateRef.current;
        if (
          !retryOnEmpty ||
          hasResult ||
          !current.voiceModeEnabled ||
          !current.settings.voiceCommandEnabled ||
          current.loading ||
          current.speaking
        ) {
          return;
        }

        window.setTimeout(() => {
          const latest = voiceLoopStateRef.current;
          if (
            latest.voiceModeEnabled &&
            latest.settings.voiceCommandEnabled &&
            !latest.loading &&
            !latest.speaking
          ) {
            startVoiceCommand({ quiet: true, retryOnEmpty: true });
          }
        }, 700);
      },
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!voiceModeEnabled || !settings.voiceCommandEnabled || listening || loading || speaking) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      startVoiceCommand({ quiet: true, retryOnEmpty: true });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [voiceModeEnabled, settings.voiceCommandEnabled, listening, loading, speaking]);

  const submit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="AI Agent \uC5F4\uAE30"
      >
        <img src={botIcon} alt="AI \uCC57\uBD07" className={styles.launcherIcon} />
      </button>

      {open && (
        <section className={styles.panel} aria-label="AI Agent Panel">
          <header className={styles.header}>
            <div className={styles.headerIdentity}>
              <img src={botIcon} alt="AI \uCC57\uBD07" className={styles.headerIcon} />
              <div className={styles.headerTitleWrap}>
                <strong>\uC6B0\uB9AC\uBD07</strong>
                {voiceModeEnabled && (
                  <span className={styles.voiceModeBadge}>\uC74C\uC131 \uBAA8\uB4DC</span>
                )}
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.modeBtn}
                onClick={voiceModeEnabled ? disableVoiceMode : () => enableVoiceMode()}
              >
                {voiceModeEnabled ? '\uC74C\uC131 \uB044\uAE30' : '\uC74C\uC131 \uCF1C\uAE30'}
              </button>
            </div>
          </header>

          {voiceModeEnabled && (
            <div className={styles.voiceGuide}>
              {pendingConfirmation
                ? `${pendingConfirmation.label} \uC9C4\uD589 \uC804 \uC7AC\uD655\uC778 \uB300\uAE30 \uC911\uC785\uB2C8\uB2E4. \uC608 \uB610\uB294 \uC544\uB2C8\uC624\uB85C \uB9D0\uC500\uD574 \uC8FC\uC138\uC694.`
                : voiceStatusText}
            </div>
          )}

          <div className={styles.body}>
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={message.role === 'user' ? styles.userMsg : styles.botMsg}
              >
                <div>{message.text}</div>
                {message.role === 'assistant' &&
                  Array.isArray(message.actionIds) &&
                  message.actionIds.length > 0 && (
                    <div className={styles.bubbleActions}>
                      {message.actionIds.map((id) => (
                        <button
                          key={`bubble-action-${idx}-${id}`}
                          type="button"
                          className={styles.bubbleActionBtn}
                          onClick={() => onQuickActionClick(id)}
                          disabled={loading}
                        >
                          {ACTION_MAP[id].label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form className={styles.form} onSubmit={submit}>
            <input
              className={styles.input}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                voiceModeEnabled
                  ? '\uB9D0\uD558\uAC70\uB098 \uC785\uB825\uD574\uC8FC\uC138\uC694'
                  : '\uB0B4\uC6A9\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694'
              }
            />
            {voiceModeEnabled && (
              <button
                type="button"
                className={styles.micBtn}
                onClick={
                  listening
                    ? stopListening
                    : () => startVoiceCommand({ quiet: false, retryOnEmpty: true })
                }
              >
                {listening ? '\uC911\uC9C0' : '\uC74C\uC131'}
              </button>
            )}
            <button type="submit" className={styles.sendBtn} disabled={disabled}>
              {loading ? '\uB300\uAE30\uC911' : '\uC804\uC1A1'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

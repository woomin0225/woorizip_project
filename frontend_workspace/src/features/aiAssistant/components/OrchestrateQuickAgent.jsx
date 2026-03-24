import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ACTION_MAP,
  STARTER_ACTION_IDS,
  VOICE_CONFIRM_ACTIONS,
  detectQuickAction,
  expandRelatedActionIds,
  isNo,
  isYes,
  normalizeText,
  suggestActionsFromText,
  uniqActionIds,
} from '../../../aiAssistantQuickAgentActions';
import {
  extractPostNoFromPath,
  getPageContext,
  getRoomContext,
  getRoomCreateContext,
  isRoomCreateMessage,
  SETTINGS_GUIDE,
} from '../../../aiAssistantQuickAgentContext';
import { formatAssistantReply } from '../../../aiAssistantQuickAgentFormatting';
import {
  getProfileEditSupportMessage,
  isProfileEditPage,
  normalizeProfileEditValue,
  parseProfileEditRequest,
} from '../../../aiAssistantQuickAgentProfileEdit';
import {
  buildRoomRecommendationRequest,
  formatRecommendedRoomsMessage,
  hasRoomPreference,
  isRoomPreferenceRequest,
  isRoomRecommendationRequest,
  isRoomSearchPageRequest,
  isRoomsSearchPage,
  pickRecommendedRoom,
  sortRecommendedRooms,
} from '../../../aiAssistantQuickAgentRoomRecommendation';
import { useAiAssistantAgentUserContext } from '../../../useAiAssistantAgentUserContext';
import { runOrchestrateCommand } from '../api/orchestrateApi';
import { fetchBoardSummary } from '../../board/api/BoardSummaryApi';
import { searchRooms } from '../../houseAndRoom/api/roomApi';
import { getMyInfo, isLessorType, updateMyInfo } from '../../user/api/userAPI';
import botIcon from '../../../assets/images/ai_bot.png';
import { useAuth } from '../../../app/providers/AuthProvider';
import { parseJwt } from '../../../app/providers/utils/jwt';
import { useVoiceMode } from '../context/VoiceModeContext';
import styles from './OrchestrateQuickAgent.module.css';

function newSessionId() {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function OrchestrateQuickAgent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, userId, isAdmin } = useAuth();
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
  const voiceLoopStateRef = useRef({
    voiceModeEnabled,
    settings,
    loading: false,
    speaking: false,
  });
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
  // 캐시에 남아 있는 사용자 유형 힌트이다.
  // 첫 렌더링 속도를 위해 먼저 쓰지만, 아래에서 실제 사용자 정보로 다시 확인한다.
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { managedHouses, resolvedIsLessor, setResolvedIsLessor, userProfile } =
    useAiAssistantAgentUserContext({ accessToken, isAdmin, open });
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: greetingText, actionIds: STARTER_ACTION_IDS },
  ]);
  // 같은 패널 안에서는 기본적으로 같은 세션을 쓰되,
  // 사용자가 다시 "방 등록"을 시작하면 새 세션으로 바꿔 오래된 상태를 끊는다.
  const [sessionId, setSessionId] = useState(newSessionId);
  const [awaitingRoomRecommendation, setAwaitingRoomRecommendation] = useState(false);
  const [lastRecommendedRooms, setLastRecommendedRooms] = useState([]);
  const [profileEditFlow, setProfileEditFlow] = useState(null);

  const resetConversation = useCallback(() => {
    setInput('');
    setLoading(false);
    setPendingConfirmation(null);
    setAwaitingRoomRecommendation(false);
    setLastRecommendedRooms([]);
    setProfileEditFlow(null);
    setSessionId(newSessionId());
    lastSpokenMessageRef.current = '';
    setMessages([
      { role: 'assistant', text: greetingText, actionIds: STARTER_ACTION_IDS },
    ]);
  }, [greetingText]);

  useEffect(() => {
    voiceLoopStateRef.current = {
      voiceModeEnabled,
      settings,
      loading,
      speaking,
    };
  }, [voiceModeEnabled, settings, loading, speaking]);

  useEffect(() => {
    if (!location.pathname.startsWith('/rooms')) {
      setAwaitingRoomRecommendation(false);
      setLastRecommendedRooms([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isProfileEditPage(location.pathname)) {
      setProfileEditFlow(null);
    }
  }, [location.pathname]);

  const disabled = useMemo(() => loading || !input.trim(), [loading, input]);
  const latestAssistant = useMemo(
    () =>
      [...messages].reverse().find((msg) => msg.role === 'assistant') || null,
    [messages]
  );
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
    if (voiceModeEnabled) {
      setOpen(true);
      if (!voiceGuideShownRef.current) {
        appendAssistantMessage(
          '음성 모드가 켜졌습니다. 말씀하시면 자동으로 듣고 답변해 드릴게요.',
          [],
          { showActions: false }
        );
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
      Array.isArray(latestAssistant.actionIds) &&
      latestAssistant.actionIds.length > 0
        ? ` 추천 명령은 ${latestAssistant.actionIds
            .map((id) => ACTION_MAP[id]?.label)
            .filter(Boolean)
            .join(', ')} 입니다.`
        : '';
    const speechText =
      `${latestAssistant.text.replace(/\n/g, ' ')}${suggestionText}`.trim();
    if (!speechText || speechText === lastSpokenMessageRef.current) return;
    lastSpokenMessageRef.current = speechText;
    speak(speechText);
  }, [voiceModeEnabled, settings.autoReadBotReplies, latestAssistant, speak]);

  const appendAssistantMessage = (messageText, actionIds = []) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: messageText,
        actionIds: uniqActionIds(actionIds),
      },
    ]);
  };

  const openAccessibilitySettings = () => {
    window.dispatchEvent(new Event('woorizip:open-accessibility-settings'));
  };

  const goToPage = (pathName, messageText, actionIds = []) => {
    navigate(pathName);
    appendAssistantMessage(messageText, actionIds);
  };

  const moveToRecommendedRoomDetail = (room) => {
    if (!room?.roomNo) return false;

    navigate(`/rooms/${room.roomNo}`);
    appendAssistantMessage(
      `${room.roomName || '선택한 방'} 상세보기 페이지로 이동했습니다. 사진, 가격, 후기와 투어 정보를 확인할 수 있습니다.`,
      ['reviews', 'tour', 'summary']
    );
    return true;
  };



  const startProfileEditWorkflow = () => {
    navigate('/mypage/edit');
    setProfileEditFlow({ step: 'field' });
    appendAssistantMessage(
      `내정보 수정 페이지로 이동했습니다. 수정할 항목을 말씀해 주세요.\n${getProfileEditSupportMessage()} 예: 이름을 강우민으로 바꿔줘`,
      []
    );
  };

  const askProfileEditValue = (field) => {
    setProfileEditFlow({ step: 'value', field });
    appendAssistantMessage(
      `${field.label}을 어떤 내용으로 바꿀까요? 새 값을 입력해 주세요.`,
      []
    );
  };

  const askProfileEditConfirm = (field, value, displayValue) => {
    setProfileEditFlow({ step: 'confirm', field, value, displayValue });
    appendAssistantMessage(
      `${field.label}을 ${displayValue}(으)로 변경할까요? 예 또는 아니오로 말씀해 주세요.`,
      []
    );
  };

  const handleProfileEditValue = (field, rawValue) => {
    const normalizedValue = normalizeProfileEditValue(field, rawValue);
    if (normalizedValue.error) {
      setProfileEditFlow({ step: 'value', field });
      appendAssistantMessage(normalizedValue.error, [
        'summary',
        'contract',
        'reservationStatus',
      ]);
      return true;
    }

    askProfileEditConfirm(
      field,
      normalizedValue.value,
      normalizedValue.displayValue
    );
    return true;
  };

  const applyProfileEditChange = async (field, value, displayValue) => {
    try {
      setLoading(true);
      await updateMyInfo({ [field.key]: value });
      if (field.key === 'name') {
        localStorage.setItem('userName', value);
      }
      window.dispatchEvent(new Event('profile-updated'));
      setProfileEditFlow({ step: 'field' });
      appendAssistantMessage(
        `${field.label}이 ${displayValue}(으)로 변경되었습니다. 다른 항목도 수정하려면 항목 이름과 새 값을 말씀해 주세요.`,
        []
      );
      return true;
    } catch (error) {
      setProfileEditFlow({ step: 'value', field });
      appendAssistantMessage(
        error?.message || '내정보 수정 중 오류가 발생했습니다.',
        []
      );
      return true;
    } finally {
      setLoading(false);
    }
  };

  const handleProfileEditFlow = async (messageText) => {
    const onEditPage = isProfileEditPage(location.pathname);
    const parsed = parseProfileEditRequest(messageText);
    const normalized = normalizeText(messageText);
    const isStartRequest =
      normalized.includes('내정보수정') ||
      normalized.includes('회원정보수정') ||
      normalized.includes('정보수정') ||
      normalized.includes('프로필수정') ||
      normalized.includes('내정보변경') ||
      normalized.includes('회원정보변경') ||
      normalized.includes('수정하고싶');

    if (isStartRequest) {
      startProfileEditWorkflow();
      return true;
    }

    if (!onEditPage && !profileEditFlow) {
      return false;
    }

    if (!profileEditFlow && parsed.kind === 'unknown') {
      return false;
    }

    if (parsed.kind === 'unsupported') {
      appendAssistantMessage(
        `${parsed.fieldLabel} 항목은 현재 챗봇으로 수정할 수 없습니다. ${getProfileEditSupportMessage()}`,
        []
      );
      return true;
    }

    if (profileEditFlow?.step === 'confirm') {
      if (isYes(messageText)) {
        return applyProfileEditChange(
          profileEditFlow.field,
          profileEditFlow.value,
          profileEditFlow.displayValue
        );
      }
      if (isNo(messageText)) {
        askProfileEditValue(profileEditFlow.field);
        return true;
      }
      appendAssistantMessage(
        '변경 여부를 확인할게요. 예 또는 아니오로 말씀해 주세요.',
        []
      );
      return true;
    }

    if (profileEditFlow?.step === 'value') {
      if (parsed.kind === 'fieldOnly') {
        askProfileEditValue(parsed.field);
        return true;
      }
      if (parsed.kind === 'fieldWithValue') {
        return handleProfileEditValue(parsed.field, parsed.rawValue);
      }
      return handleProfileEditValue(profileEditFlow.field, messageText);
    }

    if (parsed.kind === 'fieldOnly') {
      askProfileEditValue(parsed.field);
      return true;
    }

    if (parsed.kind === 'fieldWithValue') {
      return handleProfileEditValue(parsed.field, parsed.rawValue);
    }

    if (onEditPage) {
      setProfileEditFlow({ step: 'field' });
      appendAssistantMessage(
        `수정할 항목을 먼저 말씀해 주세요. ${getProfileEditSupportMessage()}`,
        []
      );
      return true;
    }

    return false;
  };
  const handleRoomRecommendationFlow = async (messageText) => {
    const normalized = normalizeText(messageText);
    const selectedRoom = pickRecommendedRoom(messageText, lastRecommendedRooms);
    if (selectedRoom) {
      setAwaitingRoomRecommendation(false);
      return moveToRecommendedRoomDetail(selectedRoom);
    }

    const explicitRecommendationRequest = isRoomRecommendationRequest(normalized);
    const preferenceRecommendationRequest = isRoomPreferenceRequest(normalized);

    if (explicitRecommendationRequest && !isRoomsSearchPage(location.pathname)) {
      goToPage(
        '/rooms',
        '방 추천은 방찾기 페이지에서 바로 도와드릴게요. 방찾기 페이지로 이동했습니다. 원하는 지역, 예산, 방 종류를 말씀해 주세요.',
        ['roomRecommend', 'deposit', 'monthlyRent']
      );
      setAwaitingRoomRecommendation(true);
      setLastRecommendedRooms([]);
      return true;
    }

    if (!isRoomsSearchPage(location.pathname)) {
      return false;
    }

    if (
      !explicitRecommendationRequest &&
      !preferenceRecommendationRequest &&
      !awaitingRoomRecommendation
    ) {
      return false;
    }

    if (awaitingRoomRecommendation && isNo(messageText)) {
      setAwaitingRoomRecommendation(false);
      appendAssistantMessage(
        '방 추천을 잠시 멈출게요. 다시 원하시면 원하는 조건과 함께 말씀해 주세요.',
        [],
        { showActions: false }
      );
      return true;
    }

    const request = buildRoomRecommendationRequest(messageText);
    if (
      (explicitRecommendationRequest || preferenceRecommendationRequest) &&
      !hasRoomPreference(request)
    ) {
      setAwaitingRoomRecommendation(true);
      appendAssistantMessage(
        '원하는 방 조건을 먼저 알려주세요. 예를 들면 전세나 월세, 보증금이나 월세 예산, 1인실 또는 2인실, 원하는 지역, 저렴한 방이나 넓은 방 같은 선호를 말씀해 주시면 바로 추천해 드릴게요.',
        [],
        { showActions: false }
      );
      return true;
    }

    try {
      setLoading(true);
      const slice = await searchRooms(request.cond, 0, 12);
      const fetchedRooms = Array.isArray(slice?.content) ? slice.content : [];
      const rooms = sortRecommendedRooms(fetchedRooms, request.preference).slice(
        0,
        3
      );

      setAwaitingRoomRecommendation(false);
      setLastRecommendedRooms(rooms);

      if (rooms.length === 0) {
        appendAssistantMessage(
          '조건에 맞는 방을 아직 찾지 못했어요. 지역이나 예산을 조금 넓히거나 방 종류를 바꿔서 다시 말씀해 주시면 다시 찾아볼게요.',
          ['roomRecommend', 'tour', 'wishlist']
        );
        return true;
      }

      appendAssistantMessage(
        `조건에 맞춰 추천한 방입니다.\n${formatRecommendedRoomsMessage(rooms)}\n\n마음에 드는 방이 있으면 "1번 방 자세히 보여줘", "그 방 들어가줘"처럼 말씀해 주세요.`,
        ['reviews', 'tour', 'wishlist']
      );
      return true;
    } catch (error) {
      const errorBody = error?.response?.data;
      const apiMessage =
        errorBody?.data ||
        errorBody?.message ||
        error?.message ||
        '방 추천을 불러오는 중 오류가 발생했습니다.';
      appendAssistantMessage(`오류: ${apiMessage}`, [
        'roomRecommend',
        'availableRooms',
        'deposit',
      ]);
      return true;
    } finally {
      setLoading(false);
    }
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
        `${action.label}을 진행할까요? 예 또는 아니오로 말씀해 주세요.`,
        expandRelatedActionIds(action.related || [], 3)
      );
      return;
    }

    if (actionId === 'reserve') {
      goToPage(
        '/reservation/view',
        '예약 페이지로 이동했습니다. 원하시는 시설과 시간을 선택해주세요.',
        ['facilityHours', 'reservationStatus', 'facilityCancel']
      );
      return;
    }

    if (actionId === 'roomRegister') {
      await sendMessage('방 등록', {
        skipQuickAction: true,
        displayText: '방 등록',
      });
      return;
    }

    if (actionId === 'roomRecommend') {
      goToPage(
        '/rooms',
        '방을 찾을 수 있도록 방 목록 페이지로 이동했습니다. 원하는 조건을 말씀해 주시면 이어서 도와드릴게요.',
        ['roomRegister', 'tour', 'wishlist']
      );
      return;
    }

    if (actionId === 'summary') {
      const postNo = extractPostNoFromPath(location.pathname);
      const roomContext = getRoomContext(location.pathname);
      const isBoardListPage = ['/notices', '/events', '/information', '/qna', '/boards'].includes(
        location.pathname
      );

      if (postNo) {
        try {
          setLoading(true);
          const response = await fetchBoardSummary(postNo);
          const result = response?.data?.data ?? response?.data;

          const summaryText = String(result?.summary || '요약 결과가 없습니다.').trim();
          const keyPoints = Array.isArray(result?.keyPoints)
            ? result.keyPoints
                .map((item) =>
                  String(item || '')
                    .replace(/^[-\s]+/, '')
                    .trim()
                )
                .filter(Boolean)
            : [];
          const conclusion = String(result?.conclusion || '').trim();
          const warnings = Array.isArray(result?.warnings)
            ? result.warnings
                .map((item) =>
                  String(item || '')
                    .replace(/^[-\s]+/, '')
                    .trim()
                )
                .filter(Boolean)
            : [];

          const sections = ['게시글 AI 요약입니다.'];
          if (summaryText) sections.push(`요약\n${summaryText}`);
          if (keyPoints.length > 0) {
            sections.push(`핵심 포인트\n- ${keyPoints.join('\n- ')}`);
          }
          if (conclusion) sections.push(`결론\n${conclusion}`);
          if (warnings.length > 0) {
            sections.push(`유의사항\n- ${warnings.join('\n- ')}`);
          }

          appendAssistantMessage(sections.join('\n\n'), [
            'roomRecommend',
            'notices',
            'mypage',
          ]);
        } catch (error) {
          const errorBody = error?.response?.data;
          const apiMessage =
            errorBody?.data ||
            errorBody?.message ||
            errorBody?.error ||
            error?.message ||
            '게시글 요약 중 오류가 발생했습니다.';

          appendAssistantMessage(`오류: ${apiMessage}`, [
            'roomRecommend',
            'notices',
            'mypage',
          ]);
        } finally {
          setLoading(false);
        }

        return;
      }

      if (isBoardListPage) {
        appendAssistantMessage(
          '게시글 목록에서는 요약할 수 없습니다. 읽고 싶은 게시글 상세로 들어간 뒤 요약을 눌러주세요.',
          ['notices', 'summary', 'mypage']
        );
        return;
      }

      if (roomContext.roomNo) {
        appendAssistantMessage(
          '페이지 내의 방 정보 요약을 참고해주세요.',
          ['roomRecommend', 'tour', 'wishlist']
        );
        return;
      }

      try {
        setLoading(true);
        const roomCreateContext = getRoomCreateContext(location, managedHouses);
        const result = await runOrchestrateCommand({
          text: '현재 보고 있는 웹페이지의 내용을 한국어로 간단히 요약해줘. 페이지에 없는 내용은 추측하지 마.',
          sessionId,
          context: {
            path: window.location.pathname,
            ...roomContext,
            ...roomCreateContext,
            currentRoomResolved: Boolean(roomContext.roomNo),
            pageSnapshot: getPageContext(),
            userProfile: {
              isAdmin,
              isLessor: resolvedIsLessor,
              userName: userProfile?.userName || userDisplayName,
              userPhone: userProfile?.userPhone || '',
            },
            siteProfile: {
              serviceName: '우리집',
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
          '요약 결과를 불러오지 못했습니다.';
        const actionIds = extractSuggestedActions(result);
        appendAssistantMessage(formatAssistantReply(String(reply)), actionIds);
      } catch (error) {
        const errorBody = error?.response?.data;
        const apiMessage =
          errorBody?.data ||
          errorBody?.message ||
          errorBody?.error ||
          error?.message ||
          '페이지 요약 중 오류가 발생했습니다.';

        appendAssistantMessage(`오류: ${apiMessage}`, [
          'summary',
          'notices',
          'mypage',
        ]);
      } finally {
        setLoading(false);
      }

      return;
    }

    if (actionId === 'facilityHours') {
      goToPage(
        '/facility/view',
        '이용시간 확인을 위해 시설 페이지로 이동했습니다. 시설을 선택하면 운영시간을 확인할 수 있습니다.',
        ['reserve', 'reservationStatus', 'facilityCancel']
      );
      return;
    }

    if (actionId === 'facilityCancel') {
      goToPage(
        '/reservation/view',
        '예약 내역 페이지로 이동했습니다. 취소할 예약을 선택해 진행해주세요.',
        ['reservationStatus', 'reserve', 'facilityHours']
      );
      return;
    }

    if (actionId === 'reservationStatus') {
      goToPage(
        '/reservation/view',
        '예약 내역 페이지로 이동했습니다. 현재 예약 상태를 확인할 수 있습니다.',
        ['facilityCancel', 'reserve', 'facilityHours']
      );
      return;
    }

    if (actionId === 'wishlist') {
      goToPage(
        '/wishlist',
        '찜 목록 페이지로 이동했습니다. 저장해둔 방을 확인할 수 있습니다.',
        ['roomRecommend', 'tour', 'contract']
      );
      return;
    }

    if (actionId === 'contract') {
      goToPage(
        '/mypage/contracts',
        '계약 페이지로 이동했습니다. 계약 내역과 진행 상태를 확인할 수 있습니다.',
        ['tour', 'wishlist', 'mypage']
      );
      return;
    }

    if (actionId === 'tour') {
      goToPage(
        '/mypage/tour',
        '투어 페이지로 이동했습니다. 투어 신청과 진행 내역을 확인할 수 있습니다.',
        ['roomRecommend', 'contract', 'wishlist']
      );
      return;
    }

    if (actionId === 'notices') {
      goToPage(
        '/notices',
        '공지사항 페이지로 이동했습니다. 최신 공지와 운영 안내를 확인할 수 있습니다.',
        ['summary', 'mypage', 'roomRecommend']
      );
      return;
    }

    if (actionId === 'mypage') {
      goToPage(
        '/mypage',
        '마이페이지로 이동했습니다. 내 정보와 개인 설정을 확인할 수 있습니다.',
        ['wishlist', 'contract', 'tour']
      );
      return;
    }

    appendAssistantMessage(
      `${action.label} 기능은 아직 준비 중입니다. 다른 명령을 말씀해 주시면 바로 도와드릴게요.`,
      expandRelatedActionIds(action.related || [], 3)
    );
  };

  const handleLocalSystemCommand = async (messageText) => {
    const normalized = normalizeText(messageText);
    if (!normalized) return false;

    if (await handleProfileEditFlow(messageText)) {
      return true;
    }

    if (await handleRoomRecommendationFlow(messageText)) {
      return true;
    }

    if (
      normalized.includes('접근성설정') ||
      normalized.includes('설정바꾸고싶') ||
      normalized.includes('설정열어') ||
      normalized.includes('설정설명')
    ) {
      openAccessibilitySettings();
      appendAssistantMessage(`접근성 설정을 열었습니다.\n${SETTINGS_GUIDE}`);
      return true;
    }

    if (
      (normalized.includes('페이지요약') || normalized.includes('자동요약')) &&
      (normalized.includes('켜') ||
        normalized.includes('on') ||
        normalized.includes('활성화'))
    ) {
      updateSetting('autoReadPageSummary', true);
      appendAssistantMessage(
        '페이지 진입 시 자동 요약 읽기를 켰습니다. 이제 페이지를 이동할 때마다 핵심 내용을 먼저 읽어드립니다.'
      );
      return true;
    }

    if (
      (normalized.includes('페이지요약') || normalized.includes('자동요약')) &&
      (normalized.includes('꺼') ||
        normalized.includes('off') ||
        normalized.includes('비활성화'))
    ) {
      updateSetting('autoReadPageSummary', false);
      appendAssistantMessage(
        '페이지 진입 시 자동 요약 읽기를 껐습니다. 필요할 때만 요약을 요청해 주세요.'
      );
      return true;
    }

    if (
      normalized.includes('공지사항') ||
      normalized === '공지' ||
      normalized.includes('공지페이지')
    ) {
      goToPage(
        '/notices',
        '공지사항 페이지로 이동했습니다. 최신 공지와 운영 안내를 확인할 수 있습니다.',
        ['summary']
      );
      return true;
    }

    if (
      normalized.includes('게시판') ||
      normalized.includes('커뮤니티') ||
      normalized.includes('qna')
    ) {
      goToPage(
        '/qna',
        '게시판 페이지로 이동했습니다. 질문글과 답변, 사용자 소통 내용을 확인할 수 있습니다.',
        ['summary']
      );
      return true;
    }

    if (
      normalized.includes('내정보수정') ||
      normalized.includes('회원정보수정') ||
      normalized.includes('정보수정') ||
      normalized.includes('프로필수정') ||
      normalized.includes('내정보변경') ||
      normalized.includes('회원정보변경') ||
      normalized.includes('수정하고싶')
    ) {
      goToPage(
        '/mypage/edit',
        '내정보 수정 페이지로 이동했습니다. 변경할 항목과 새로 바꿀 내용을 말씀해 주세요.',
        []
      );
      return true;
    }

    if (
      normalized.includes('내정보보기') ||
      normalized.includes('내정보확인') ||
      normalized.includes('회원정보보기') ||
      normalized.includes('회원정보확인') ||
      normalized.includes('프로필보기')
    ) {
      goToPage(
        '/mypage/info',
        '내정보 보기 페이지로 이동했습니다. 현재 등록된 정보를 확인할 수 있습니다.',
        ['summary', 'contract', 'wishlist']
      );
      return true;
    }

    if (
      normalized.includes('마이페이지') ||
      normalized.includes('내정보') ||
      normalized.includes('내정보페이지') ||
      normalized.includes('회원정보')
    ) {
      goToPage(
        '/mypage',
        '마이페이지로 이동했습니다. 내 정보와 개인 설정을 확인할 수 있습니다.',
        ['contract', 'wishlist', 'reservationStatus']
      );
      return true;
    }

    if (
      normalized.includes('찜목록') ||
      normalized.includes('위시리스트') ||
      normalized.includes('찜한방') ||
      normalized.includes('찜페이지')
    ) {
      goToPage(
        '/wishlist',
        '찜 목록 페이지로 이동했습니다. 저장해둔 방을 확인할 수 있습니다.',
        ['roomRecommend', 'tour', 'contract']
      );
      return true;
    }

    if (
      normalized.includes('계약페이지') ||
      normalized.includes('계약내역') ||
      normalized.includes('계약목록') ||
      normalized.includes('전자계약')
    ) {
      goToPage(
        '/mypage/contracts',
        '계약 페이지로 이동했습니다. 계약 진행 상태와 계약 내역을 확인할 수 있습니다.',
        ['contract', 'moveIn', 'moveOut']
      );
      return true;
    }


    if (
      normalized.includes('투어페이지') ||
      normalized.includes('투어내역') ||
      normalized.includes('투어목록')
    ) {
      goToPage(
        '/mypage/tour',
        '투어 페이지로 이동했습니다. 투어 신청과 진행 내역을 확인할 수 있습니다.',
        ['tour', 'roomRecommend', 'wishlist']
      );
      return true;
    }

    if (isRoomSearchPageRequest(normalized)) {
      goToPage(
        '/rooms',
        '방 목록 페이지로 이동했습니다. 원하는 지역과 예산, 방 종류를 알려주시면 더 잘 찾아드릴게요.',
        ['roomRecommend', 'summary']
      );
      return true;
    }

    if (
      normalized.includes('공용시설') ||
      normalized.includes('시설페이지') ||
      normalized === '시설안내'
    ) {
      goToPage(
        '/facility/view',
        '공용시설 페이지로 이동했습니다. 시설 안내와 예약 정보를 확인할 수 있습니다.',
        ['facilityHours', 'reserve', 'reservationStatus']
      );
      return true;
    }

    if (
      normalized.includes('예약내역') ||
      normalized.includes('예약페이지') ||
      normalized.includes('예약확인')
    ) {
      goToPage(
        '/reservation/view',
        '예약 페이지로 이동했습니다. 현재 예약 상태를 확인하거나 예약을 진행할 수 있습니다.',
        ['reserve', 'facilityCancel']
      );
      return true;
    }

    if (normalized === '홈' || normalized.includes('홈으로가')) {
      goToPage(
        '/',
        '홈으로 이동했습니다. 주요 메뉴와 서비스 안내를 확인할 수 있습니다.',
        ['summary']
      );
      return true;
    }

    if (
      normalized.includes('현재페이지요약') ||
      normalized === '요약해줘' ||
      normalized === '요약'
    ) {
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
      fromResponse.forEach((item) =>
        addMatches(item?.id || item?.label || item)
      );
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
        `${ACTION_MAP[actionId]?.label || '요청'}을 계속 진행합니다.`,
        expandRelatedActionIds([actionId], 3)
      );
      void runQuickAction(actionId, { skipConfirm: true });
      return true;
    }

    if (isNo(messageText)) {
      const actionId = pendingConfirmation.actionId;
      setPendingConfirmation(null);
      appendAssistantMessage(
        `${ACTION_MAP[actionId]?.label || '요청'}을 취소했습니다. 다른 명령을 말씀해 주세요.`,
        ['summary', 'roomRecommend', 'reserve']
      );
      return true;
    }

    appendAssistantMessage(
      '재확인이 필요합니다. 예 또는 아니오로 말씀해 주세요.',
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

    if (await handleLocalSystemCommand(messageText)) {
      return;
    }

    const quickAction = options.skipQuickAction
      ? null
      : detectQuickAction(messageText);
    if (quickAction) {
      void runQuickAction(quickAction);
      return;
    }

    setLoading(true);

    try {
      let lessorForRequest = resolvedIsLessor;
      let requestSessionId = sessionId;

      if (isRoomCreateMessage(messageText)) {
        // 사용자가 다시 "방 등록"을 보냈다면 이전 draft 수집을 이어가기보다
        // 새 대화를 시작하는 편이 안전하다. 그래야 예전 pending_slot이 섞이지 않는다.
        requestSessionId = newSessionId();
        setSessionId(requestSessionId);

        try {
          // 방 등록은 권한 차이가 분명해서, 실제 사용자 정보로 한 번 더 확인한다.
          // 메시지를 보내는 마지막 순간에도 실제 사용자 정보를 다시 확인해야
          // 비임대인 사용자가 방 등록 흐름으로 들어가는 일을 막을 수 있다.
          const info = await getMyInfo();
          lessorForRequest = isLessorType(info?.type);
          setResolvedIsLessor(lessorForRequest);
        } catch {
          // 권한 확인에 실패했을 때 등록 흐름을 열어 버리면
          // 비임대인에게 건물명만 반복해서 묻게 될 수 있으므로 보수적으로 막는다.
          // 확인 실패 시에도 흐름을 열어 두면 같은 질문만 반복할 수 있으므로,
          // 여기서는 안전하게 "권한 없음" 쪽으로 처리한다.
          lessorForRequest = false;
          setResolvedIsLessor(false);
        }

        if (!isAdmin && !lessorForRequest) {
          // 프론트에서 먼저 막아 주면 서버 응답을 기다리지 않아도 바로 안내할 수 있다.
          appendAssistantMessage(
            '방 등록은 임대인 또는 관리자만 진행할 수 있습니다.'
          );
          return;
        }
      }

      const roomContext = getRoomContext(location.pathname);
      const roomCreateContext = getRoomCreateContext(location, managedHouses);
      const result = await runOrchestrateCommand({
        text: messageText,
        sessionId: requestSessionId,
        context: {
          path: window.location.pathname,
          ...roomContext,
          ...roomCreateContext,
          currentRoomResolved: Boolean(roomContext.roomNo),
          pageSnapshot: getPageContext(),
          userProfile: {
            isAdmin,
            isLessor: lessorForRequest,
            userName: userProfile?.userName || userDisplayName,
            userPhone: userProfile?.userPhone || '',
          },
          siteProfile: {
            serviceName: '우리집',
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
        '응답은 받았지만 표시 가능한 메시지 필드가 없습니다.';
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
          `${ACTION_MAP[actionIds[0]]?.label || '다음 작업'}을 이어서 진행할까요? 예 또는 아니오로 말씀해 주세요.`,
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
        'Agent 호출 중 오류가 발생했습니다.';
      appendAssistantMessage(`오류: ${apiMessage}`, [], { showActions: false });
    } finally {
      setLoading(false);
    }
  };

  const onQuickActionClick = (actionId) => {
    const action = ACTION_MAP[actionId];
    if (!action || loading) return;
    if (actionId === 'roomRegister') {
      void runQuickAction(actionId);
      return;
    }
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
        '음성 명령이 꺼져 있습니다. 접근성 설정에서 음성 명령 사용을 켜 주세요.'
      );
      return;
    }

    if (!isSpeechRecognitionSupported) {
      appendAssistantMessage(
        '이 브라우저에서는 음성 인식을 지원하지 않습니다. 텍스트 입력을 사용해 주세요.'
      );
      return;
    }

    if (!quiet) {
      speak(
        '말씀해 주세요. 약 2초 정도 멈추면 자동으로 처리합니다.'
      );
    }

    let hasResult = false;
    let hasVoiceError = false;

    startListening({
      onResult: (transcript) => {
        hasResult = true;
        if (!transcript) {
          if (!retryOnEmpty) {
            appendAssistantMessage(
              '음성 입력을 인식하지 못했습니다. 다시 말씀해 주세요.',
              [],
              { showActions: false }
            );
          }
          return;
        }
        void sendMessage(transcript, {
          displayText: `음성: ${transcript}`,
        });
      },
      onError: (event) => {
        const errorType = event?.error || event?.message || '';
        if (errorType === 'no-speech' || errorType === 'aborted') {
          return;
        }
        if (hasVoiceError) {
          return;
        }
        hasVoiceError = true;
        appendAssistantMessage(
          '음성 입력 중 문제가 발생했습니다. 다시 시도해 주세요. 음성 모드를 종료하고 텍스트 모드로 전환합니다.',
          [],
          { showActions: false }
        );
        disableVoiceMode();
      },
      onEnd: () => {
        const current = voiceLoopStateRef.current;
        if (
          !retryOnEmpty ||
          hasResult ||
          hasVoiceError ||
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
    if (
      !voiceModeEnabled ||
      !settings.voiceCommandEnabled ||
      listening ||
      loading ||
      speaking
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      startVoiceCommand({ quiet: true, retryOnEmpty: true });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [
    voiceModeEnabled,
    settings.voiceCommandEnabled,
    listening,
    loading,
    speaking,
  ]);

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
        aria-label="AI Agent 열기"
      >
        <img src={botIcon} alt="AI 챗봇" className={styles.launcherIcon} />
      </button>

      {open && (
        <section className={styles.panel} aria-label="AI Agent Panel">
          <header className={styles.header}>
            <div className={styles.headerIdentity}>
              <img src={botIcon} alt="AI 챗봇" className={styles.headerIcon} />
              <div className={styles.headerTitleWrap}>
                <strong>우리봇</strong>
                {voiceModeEnabled && (
                  <span className={styles.voiceModeBadge}>음성 모드</span>
                )}
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={resetConversation}
                disabled={loading}
              >
                새 대화
              </button>
              <button
                type="button"
                className={styles.modeBtn}
                onClick={
                  voiceModeEnabled ? disableVoiceMode : () => enableVoiceMode()
                }
              >
                {voiceModeEnabled
                  ? '음성 끄기'
                  : '음성 켜기'}
              </button>
            </div>
          </header>

          {voiceModeEnabled && (
            <div className={styles.voiceGuide}>
              {pendingConfirmation
                ? `${pendingConfirmation.label} 진행 전 재확인 대기 중입니다. 예 또는 아니오로 말씀해 주세요.`
                : voiceStatusText}
            </div>
          )}

          <div className={styles.body}>
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={
                  message.role === 'user' ? styles.userMsg : styles.botMsg
                }
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
                  ? '말하거나 입력해주세요'
                  : '내용을 입력해주세요'
              }
            />
            {voiceModeEnabled && (
              <button
                type="button"
                className={styles.micBtn}
                onClick={
                  listening
                    ? stopListening
                    : () =>
                        startVoiceCommand({ quiet: false, retryOnEmpty: true })
                }
              >
                {listening ? '중지' : '음성'}
              </button>
            )}
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={disabled}
            >
              {loading ? '대기중' : '전송'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}









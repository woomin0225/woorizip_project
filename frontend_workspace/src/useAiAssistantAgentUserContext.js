import { useEffect, useMemo, useState } from 'react';
import { getMyHouses } from './features/houseAndRoom/api/houseApi';
import { getIsLessorHint, getMyInfo, isLessorType } from './features/user/api/userAPI';
import { normalizeHouseContextItem } from './aiAssistantQuickAgentContext';

function buildUserProfile(info) {
  const userName = String(
    info?.name || info?.userName || info?.nickname || ''
  ).trim();
  const userPhone = String(
    info?.phone || info?.phoneNumber || info?.userPhone || ''
  ).trim();

  return {
    userName,
    userPhone,
  };
}

export function useAiAssistantAgentUserContext({ accessToken, isAdmin, open }) {
  const hintedIsLessor = useMemo(() => getIsLessorHint() === true, []);
  const [resolvedIsLessor, setResolvedIsLessor] = useState(() => getIsLessorHint() === true);
  const [managedHouses, setManagedHouses] = useState([]);
  const [managedHousesLoaded, setManagedHousesLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState({ userName: '', userPhone: '' });

  useEffect(() => {
    if (!accessToken) {
      setResolvedIsLessor(false);
      setUserProfile({ userName: '', userPhone: '' });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const info = await getMyInfo();
        if (cancelled) return;
        setResolvedIsLessor(isLessorType(info?.type));
        setUserProfile(buildUserProfile(info));
      } catch {
        if (!cancelled) {
          setResolvedIsLessor(hintedIsLessor);
          setUserProfile({ userName: '', userPhone: '' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, hintedIsLessor]);

  useEffect(() => {
    setManagedHouses([]);
    setManagedHousesLoaded(false);
  }, [accessToken, isAdmin, resolvedIsLessor]);

  useEffect(() => {
    if (!open || managedHousesLoaded) return undefined;
    if (!resolvedIsLessor && !isAdmin) {
      setManagedHouses([]);
      setManagedHousesLoaded(true);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const houses = await getMyHouses();
        if (cancelled) return;
        setManagedHouses(Array.isArray(houses) ? houses.map(normalizeHouseContextItem).filter(Boolean) : []);
      } catch {
        if (!cancelled) setManagedHouses([]);
      } finally {
        if (!cancelled) setManagedHousesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, managedHousesLoaded, open, resolvedIsLessor]);

  return { managedHouses, resolvedIsLessor, setResolvedIsLessor, userProfile };
}

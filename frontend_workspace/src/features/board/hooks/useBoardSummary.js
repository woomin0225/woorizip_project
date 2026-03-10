import { useCallback, useState } from 'react';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import { fetchBoardSummary } from '../api/BoardSummaryApi';

export function useBoardSummary(postNo) {
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [opened, setOpened] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!postNo) return;

    setOpened(true);
    setSummaryLoading(true);
    setSummaryError('');

    try {
      const resp = await fetchBoardSummary(postNo);
      const dto = unwrapApi(resp);
      setSummaryData(dto || null);
    } catch (e) {
      console.error(e);
      setSummaryError('AI 요약을 불러오지 못했습니다.');
      setSummaryData(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [postNo]);

  const toggleOpened = useCallback(() => {
    setOpened((prev) => !prev);
  }, []);

  return {
    opened,
    summaryData,
    summaryLoading,
    summaryError,
    loadSummary,
    toggleOpened,
    hasLoaded: Boolean(summaryData),
  };
}

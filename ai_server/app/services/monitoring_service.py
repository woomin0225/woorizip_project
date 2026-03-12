from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

from app.ibm.llm_client import LLMClient


class MonitoringService:
    def __init__(self, llm: LLMClient | None = None):
        self.llm = llm

    def _parse_hour(self, ts: str | None) -> int | None:
        if not ts:
            return None
        try:
            # 2026-03-01T12:34:56 or 2026-03-01 12:34:56
            if "T" in ts:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            else:
                dt = datetime.fromisoformat(ts)
            return dt.hour
        except Exception:
            return None

    async def analyze(self, kind: str, payload: dict[str, Any], tone: str = "업무용") -> dict:
        kind = (kind or "generic").lower()
        if kind == "view_abuse":
            events = payload.get("events") or []
            # key: (user_id or ip)
            c = Counter()
            for e in events:
                key = e.get("user_id") or e.get("ip") or "unknown"
                c[key] += 1

            top = c.most_common(5)
            suspicious = [{"key": k, "count": n} for k, n in top if n >= 30]  # 임계치는 MVP 기준

            base = {
                "kind": kind,
                "total_events": len(events),
                "top": [{"key": k, "count": n} for k, n in top],
                "suspicious": suspicious,
                "score": 0.9 if suspicious else 0.2,
            }

            if self.llm:
                prompt = f"""조회수 이벤트 어뷰징 분석 결과를 운영자용으로 요약해줘.
TONE: {tone}
DATA: {base}
- 이상 의심이 있으면 '권장조치'를 3개 제시해줘.
"""
                summary = await self.llm.chat([{"role": "user", "content": prompt}], temperature=0.2, max_new_tokens=500)
                base["summary"] = summary
            else:
                base["summary"] = "의심 키가 있으면 차단/레이트리밋/로그 검토를 권장합니다."
            return base

        if kind == "facility_usage":
            logs = payload.get("logs") or []
            actions = Counter([x.get("action", "unknown") for x in logs])
            hours = Counter()
            for x in logs:
                h = self._parse_hour(x.get("ts"))
                if h is not None:
                    hours[h] += 1

            peak = hours.most_common(3)
            cancel_rate = 0.0
            total_book = actions.get("book", 0)
            if total_book:
                cancel_rate = actions.get("cancel", 0) / float(total_book)

            base = {
                "kind": kind,
                "total_logs": len(logs),
                "actions": dict(actions),
                "peak_hours": [{"hour": h, "count": n} for h, n in peak],
                "cancel_rate": round(cancel_rate, 3),
                "score": 0.8 if cancel_rate >= 0.5 else 0.3,
            }

            if self.llm:
                prompt = f"""공용시설 사용현황/이상패턴을 임대인에게 보여줄 문구로 요약해줘.
TONE: {tone}
DATA: {base}
- (1) 한줄요약 (2) 관찰된 패턴 (3) 권장조치 2개
"""
                summary = await self.llm.chat([{"role": "user", "content": prompt}], temperature=0.25, max_new_tokens=450)
                base["summary"] = summary
            else:
                base["summary"] = "피크 시간대와 취소율을 기반으로 운영 안내를 제공합니다."
            return base

        # generic
        base = {"kind": kind, "payload_keys": list(payload.keys())}
        if self.llm:
            summary = await self.llm.chat([{"role": "user", "content": f"TONE:{tone}\nDATA:{base}\n요약해줘."}], temperature=0.3, max_new_tokens=200)
            base["summary"] = summary
        return base

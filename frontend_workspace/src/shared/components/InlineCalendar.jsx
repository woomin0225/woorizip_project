import React, { useEffect, useMemo, useState } from 'react';
import styles from './InlineCalendar.module.css';

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDate(value) {
  if (!value || typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mm, d);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== mm ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function monthTitle(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function InlineCalendar({ value, onChange, minDate }) {
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const minDateObj = useMemo(() => parseIsoDate(minDate), [minDate]);
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : new Date(today.getFullYear(), today.getMonth(), 1)
  );

  useEffect(() => {
    if (selectedDate) {
      const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      setViewMonth((prev) => {
        if (prev.getFullYear() === nextMonth.getFullYear() && prev.getMonth() === nextMonth.getMonth()) {
          return prev;
        }
        return nextMonth;
      });
    }
  }, [selectedDate]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const firstWeekDay = firstOfMonth.getDay();
    const daysInMonth = lastOfMonth.getDate();
    const result = [];

    for (let i = 0; i < 42; i += 1) {
      const dayOffset = i - firstWeekDay + 1;
      const cellDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayOffset);
      const isCurrentMonth = dayOffset >= 1 && dayOffset <= daysInMonth;
      const cellIso = toIsoDate(cellDate);
      const disabled = !!(minDateObj && cellDate < minDateObj);
      const isSelected = !!(selectedDate && toIsoDate(selectedDate) === cellIso);
      const isToday = toIsoDate(today) === cellIso;

      result.push({
        key: `${cellIso}-${i}`,
        day: cellDate.getDate(),
        iso: cellIso,
        isCurrentMonth,
        disabled,
        isSelected,
        isToday,
      });
    }
    return result;
  }, [minDateObj, selectedDate, today, viewMonth]);

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          aria-label="이전 달"
        >
          {'<'}
        </button>
        <strong className={styles.monthText}>{monthTitle(viewMonth)}</strong>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          aria-label="다음 달"
        >
          {'>'}
        </button>
      </div>

      <div className={styles.weekRow}>
        {DAY_LABELS.map((label) => (
          <span key={label} className={styles.weekLabel}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            className={[
              styles.dayBtn,
              cell.isCurrentMonth ? '' : styles.outsideDay,
              cell.isToday ? styles.today : '',
              cell.isSelected ? styles.selected : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange?.(cell.iso)}
            disabled={cell.disabled}
          >
            {cell.day}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getReviewRanking } from '../../api/roomApi';
import ReviewRankingList from './ReviewRankingList';
import styles from './ViewsRankingFrame.module.css';

ReviewRankingFrame.propTypes = {
  period: PropTypes.number.isRequired,
  rankingTitle: PropTypes.string,
  limit: PropTypes.number,
};

export default function ReviewRankingFrame({ period, rankingTitle, limit = 10 }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchRanking = async () => {
      const periodType = `DAY${period}`;
      const data = await getReviewRanking(periodType, limit);
      if (!cancelled) setList(Array.isArray(data) ? data : []);
    };

    fetchRanking();
    return () => {
      cancelled = true;
    };
  }, [period, limit]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h4 className={styles.title}>{rankingTitle}</h4>
        <span className={styles.subTitle}>{`Last ${period} day${period > 1 ? 's' : ''}`}</span>
      </div>
      <div className={styles.listWrap}>
        <ReviewRankingList list={list} />
      </div>
    </section>
  );
}

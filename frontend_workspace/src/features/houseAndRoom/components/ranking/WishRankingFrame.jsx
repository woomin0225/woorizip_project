import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getWishRanking } from '../../api/roomApi';
import WishRankingList from './WishRankingList';
import styles from './ViewsRankingFrame.module.css';

WishRankingFrame.propTypes = {
  rankingTitle: PropTypes.string,
  limit: PropTypes.number,
  subTitle: PropTypes.string,
};

export default function WishRankingFrame({
  rankingTitle,
  limit = 10,
  subTitle = 'Top wished rooms',
}) {
  const [list, setList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchRanking = async () => {
      const data = await getWishRanking(limit);
      if (!cancelled) setList(Array.isArray(data) ? data : []);
    };

    fetchRanking();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h4 className={styles.title}>{rankingTitle}</h4>
        <span className={styles.subTitle}>{subTitle}</span>
      </div>
      <div className={styles.listWrap}>
        <WishRankingList list={list} />
      </div>
    </section>
  );
}

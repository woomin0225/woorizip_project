import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { getPopularHouses, getPopularRooms } from "../../api/viewApi";
import EstateRankingList from './EstateRankingList';
import styles from './EstateRankingFrame.module.css';

EstateRankingFrame.propTypes ={
    type: PropTypes.oneOf(['room', 'house']).isRequired,
    period: PropTypes.number.isRequired,
    rankingTitle: PropTypes.string,
    limit: PropTypes.number
}

export default function EstateRankingFrame({type, period, rankingTitle, limit=10}) {
    const [list, setList] = useState([]);
    
    useEffect(()=>{
        let cancelled = false;

        const fetchRanking = async () => {
            const periodType = `DAY${period}`;
            const data =
                type === 'room'
                    ? await getPopularRooms(periodType, limit)
                    : await getPopularHouses(periodType, limit);
            if(!cancelled) setList(data ?? []);
        };

        fetchRanking();
        return () => {
            cancelled = true;
        };
    }, [type, period, limit]);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h4 className={styles.title}>{rankingTitle}</h4>
                <span className={styles.subTitle}>{`Last ${period} day${period > 1 ? "s" : ""}`}</span>
            </div>
            <div className={styles.listWrap}>
                <EstateRankingList list={list} type={type}/>
            </div>
        </section>
    );
}

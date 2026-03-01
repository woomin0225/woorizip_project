import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { getPopularHouses, getPopularRooms } from "../../api/viewApi";
import EstateRankingList from './EstateRankingList';

EstateRankingFrame.propTypes ={
    type: PropTypes.oneOf(['room', 'house']).isRequired,
    period: PropTypes.number.isRequired,
    RankingTitle: PropTypes.string,
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
        <div>
            <div>
                <h4>{rankingTitle}</h4>
                <EstateRankingList list={list} type={type}/>
            </div>
        </div>
    );
}
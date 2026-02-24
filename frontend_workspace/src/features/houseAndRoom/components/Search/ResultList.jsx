import ResultItem from "./ResultItem";

export default function ResultList({slice=[], criterion, onLoadMore, onChangeCriterion, hasNext, loading,}){
    function searchLatest() {
        onChangeCriterion("LATEST");
    }
    function searchLargest() {
        onChangeCriterion("AREA");
    }
    return (
        <div>
            <button onClick={searchLatest} value="LATEST" disabled={criterion === "LATEST"}>최신업데이트순</button>
            <button onClick={searchLargest} value="AREA"disabled={criterion === "AREA"}>면적큰순</button>
            <br/>
            {slice.map((room)=>{
                <ResultItem key={room.roomNo} roomSearchResponse={room}/>
            })}
            <div style={{marginTop:12}}>
                <button onClick={onLoadMore} disabled={!hasNext || loading}>
                    {loading ? "불러오는 중..." : (hasNext ? "더보기" : "마지막입니다")}
                </button>
            </div>
        </div>
    );
}
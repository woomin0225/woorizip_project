// 내 건물 보기의 1행 표시: 누르면 해당 건물 수정하기로 이동
export default function HouseItem({house}){
    return (
        <div>
            <table>
                <tr>
                    <td>
                        {/* 건물이름자리 */}
                        <button>{house.houseName}</button>
                    </td>
                    <td>
                        {/* 건물주소자리 */}
                        <span>&#40;{house.houseZip}&#41;</span> &nbsp;
                        <span>{house.houseAddress}</span> &nbsp;
                        <span>{house.houseAddressDetail}</span>
                    </td>
                </tr>
            </table>
        </div>
    );
}
// 건물 정보 수정 페이지

import { useState } from "react";
import { getHouse, getHouseImages, modifyHouse } from "../../api/houseApi";
import { useNavigate } from "react-router-dom";

export default function HouseModify({houseNo}){
    const [house, setHouse] = useState({}); // HouseDto, 기존에 저장된 건물 정보 dto
    const [images, setImages] = useState([]);    // List<HouseImageDto>, 기존에 저장된 이미지dto 배열
    const [deleteImageNos, setDeleteImageNos] = useState([]);   //삭제할 이미지id 배열
    const [newImages, setNweImages] = useState([]); //새로 저장할 파일 배열
    useEffect(()=>{
        const initHouse = getHouse(houseNo);
        setHouse(initHouse);
        const initImages = getHouseImages(houseNo);
        setImages(initImages)
    }, []);
    useEffect(()=>{
        onChange();
    }, [house]);
    const navigate = useNavigate();
    function onChange(event) {
        const { name, type, value } = event.target;

        setHouse((current) => {
            const numberFields = new Set([
                'completionYear', 'area', 'floors', 'maxThouseholds', 'parking',
            ]);
            if (numberFields.has(name)) {
                return { ...current, [name]: value === '' || value === null ? null : Number(value) };
            }

            const booleanFields = new Set([
                'elevatorYn', 'petYn', 'femaleLimit',
            ]);
            if (booleanFields.has(name)) return { ...current, [name]: Boolean(value) };

            if (type === 'text') return { ...current, [name]: value};

            return { ...current, [name]: value };
        });
    }
    function clickCompletion(){
        const res = modifyHouse(houseNo, house, deleteImageNos=[], newImages=[]);
        // if() 조건 추가하기
        // 수정 ok면 관리페이지로 이동
        navigate('/estate/manage');
    }
    function clickSearchAddress(){
        //도로명 주소검색 api 호출해서 data를 zip, address, addressDetail로 업데이트
    }
    return (
        <div>
            <button onClick={clickCompletion}>수정완료</button>
            <HouseForm
                house={house}
                images={images}
                onChange={onChange}
                clickSearchAddress={clickSearchAddress}/>
        </div>
    );
}
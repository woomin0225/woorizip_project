# app/schemas.py

from datetime import datetime

from pydantic import BaseModel

# 방 정보 종합 요약시 사용 (리뷰, 이미지설명 포함)
class RoomTotalRequest(BaseModel):
    roomNo: str
    roomName: str
    houseNo: str
    houseName: str
    houseAddress: str
    roomCreatedAt: datetime
    roomUpdatedAt: datetime
    roomDeposit: int
    roomMonthly: int
    roomMethod: str
    roomArea: float
    roomFacing: str
    roomAvailableDate: datetime
    roomAbstract: str
    roomRoomCount: int
    roomBathCount: int
    roomEmptyYn: bool
    roomStatus: str
    roomOptions: str
    imageSummary: str
    reviewSummary: str
    
    
# 리뷰나 이미지 캡션들 요약시 사용
class RoomSummaryRequest(BaseModel):
    roomNo: str
    texts: list

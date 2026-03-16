# Qdrant 사용 (임베딩 저장)

1. docker desktop 설치

- 구글 검색 : install docker desktop -> 사이트 접속 -> 본인 OS에 맞게 다운로드 -> 파일 설치 -> use recommand settings 선택 후 설치

2. 명령프롬프트 or 터미널에서 실행
   docker pull qdrant/qdrant

docker run -d \
 --name qdrant-local \
 -p 6333:6333 \
 -p 6334:6334 \
 -v /Users/joosung/qdrant_storage:/qdrant/storage \
 qdrant/qdrant

3. 실행확인
   docker ps
   curl http://localhost:6333

예시 - {"title":"qdrant - vector search engine","version":"1.17.0", ...}

3-1. 컨테이너 관리
실행 중지
docker stop qdrant-local
재시작
docker start qdrant-local
컨테이너 삭제
docker rm -f qdrant-local

4. Qdrant 컬렉션 생성
   컬렉션 이름 예시 : room_image_analysis
   curl -X PUT "http://localhost:6333/collections/room_image_analysis" \
    -H "Content-Type: application/json" \
    --data-raw '{
   "vectors": {
   "size": 384,
   "distance": "Cosine"
   }
   }'

생성 확인 : curl http://localhost:6333/collections/room_image_analysis

# 방 등록 후 저장 확인

- curl http://localhost:6333/collections/room_image_analysis

저장된 payload 확인
curl -X POST "http://localhost:6333/collections/room_image_analysis/points/scroll" \
 -H "Content-Type: application/json" \
 --data-raw '{
"limit": 10,
"with_payload": true,
"with_vector": false
}'

# Qdrant 검색 테스트

curl -X POST "http://localhost:8000/ai/embedding" \
 -H "Content-Type: application/json" \
 -H "X-API-KEY: YOUR_INTERNAL_API_KEY" \
 --data-raw '{
"text": "에어컨이 있는 방"
}'

결과로 나온 embedding 배열 복사

curl -X POST "http://localhost:6333/collections/room_image_analysis/points/search" \
 -H "Content-Type: application/json" \
 --data-raw '{
"vector": [복사한 임베딩 배열],
"limit": 3,
"with_payload": true,
"with_vector": false
}'

# GroundingDINO 설치 가이드

1. 가상환경 활성화
   .\.venv\Scripts\activate

2. requirements.txt 설치
   pip install -r requirements-js.txt

3. GroundingDINO 폴더로 이동
   cd GroundingDINO

4. 설치
   pip install -e .

   오류 해결방법 (이 방법으로 설치해주세요!!)
   cd ../
   rm -rf .venv
   가상환경 재생성 및 가상환경 실행
   python -m ensurepip --upgrade
   python -m pip install --upgrade pip setuptools wheel
   python -m pip install torch torchvision
   python -m pip install -r requirements-js.txt
   cd GroundingDINO
   python -m pip install -e . --no-build-isolation

- 설치 중 오류가 발생하면 Visual C++ Build Tools가 필요할 수 있습니다.
- GroundingDINO는 환경에 따라 기본 `pip install -e .`만으로 설치 시 빌드/의존성 충돌이 발생할 수 있음
- 새 가상환경에서 `torch`, `torchvision`, `setuptools`, `wheel`을 먼저 설치한 뒤
  `python -m pip install -e . --no-build-isolation`로 설치하면 해결될 수 있음

5. 설치 확인
   python -c "import groundingdino; print(groundingdino.**file**)"
   python -c "import groundingdino.util.inference as m; print(m.**file**)"

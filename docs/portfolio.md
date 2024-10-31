---
# sidebar_position: 1
id: portfolio
# title: Portfolio
---
# Portfolio
## 앙상블 기법을 활용한 안개 발생 예측 모델링
- [2024 날씨 빅데이터 콘테스트](https://bd.kma.go.kr/contest/) 
    - 과제 2: **기상특성에 따른 안개 발생 진단**
    - [GitHub Repository](https://github.com/benidjor/weather-contest)
- `Python`, `Machine Learning`, `Jira`, `Google SpreadSheet`
### 분석 배경 및 목적
- 안개로 인한 **교통 시스템 제한** 및 불필요한 **사회적 비용** 문제 인식
- 안개 발생 시의 **기상 요인** 식별 및 머신러닝 기반 **안개 예측** 모델 개발

### 작업 관리
- 작업 시작 전 **Jira 티켓 생성 후, GitHub 커밋**
    - 칸반 보드 기반의 워크플로우 및 일정 관리
    - 티켓과 동명의 GitHub 브랜치를 생성하여, 커밋 및 Pull Request 리뷰 진행
        - Jira와 GitHub 연동에 기반한 과업에 대한 결과물 **버전 단위 관리**
- Google SpreadSheet에 모델 성능 및 사용 변수 **기록 공유**, Discord를 통한 **실시간 커뮤니케이션**
- **커밋 컨벤션 통일**에 기반한 작업 및 식별 효율화
- 오프라인 **정기 미팅** 진행을 통한 작업 목표 및 방향성 공유, Notion 및 Jira에 **미팅 내용 기록 및 작업물 아카이빙**

### 분석 내용
#### 1. EDA
- 월별, 지역별 안개 발생 **동향의 차이**를 식별
- 관측 오류, 기상 이변 등에 의한 **이상치 및 결측치**를 탐지

#### 2. Feature Engineering
- 관측소 변수를 **지역 특성**에 따라 그룹핑하는 방법 고안
- ±3 std를 기준으로 월별, 지역별 **이상치 Capping** 처리
- **결측치**를 월별, 지역별 평균값으로 대체
- **파생 변수** 생성
    - 이슬점 산출, 이슬점 도달 여부, 습수
    - 기온-지면 온도 차
    
#### 3. Modeling
##### 머신러닝 모델링 플로우 차트
![모델링 플로우 차트](https://i.imgur.com/eGKHxHF.png)
- 이진 분류 모델과 다중 분류 모델을 혼합한 **Ensemble 모델** 개발
    - **각 지역**에 대해 `Random Forest Classifier` 모델 생성
        1. 선행 모델은 안개 발생 여부를 예측하는 **이진 분류** 수행
        2. 이후, 안개의 시정 계급을 예측하는 **다중 분류** 수행
    - 하이퍼파라미터 튜닝
        - `max_depth`, `max_features` 조정하여 **과적합 방지**
- 평가 지표: CSI Index
    - 최종 Validation CSI Index : **0.317**

<br />

---
<br />
<br />

## 강남구 모범 음식점 고객 만족도 분석
- [제 1회 강남구 공공데이터 활용·분석 아이디어 공모전 ](https://www.gangnam.go.kr/board/B_000031/1073527/view.do?mid=ID01_0313)
    - [GitHub Repository](https://github.com/benidjor/model-restaurant-in-gangnam)
- `Python`, `Jupyter Notebook`, `Crawling`

### 분석 배경 및 목적
- 모범 음식점의 의의: 식품 접객업소의 위생 및 서비스 개선을 통한 외식 문화를 활성화
    - 강남구를 찾는 관광객이 음식점을 고려하는 중요한 요소
- 그러나 강남구의 모범 음식점 제도에 대한 **낮은 인지도**와 **제도의 효용성**에 의문
    - **강남구의 모범 음식점 지정 현황은, 관광객의 니즈를 만족하고 긍정적인 외식 경험을 제공하는가?**

### 분석 내용
#### Feature Engineering
- `Open API` 활용 데이터 호출 
    - [강남구 **모범 음식점** 지정 현황](https://data.seoul.go.kr/dataList/OA-11295/S/1/datasetView.do), [강남구 **일반 음식점** 인허가 정보](https://data.seoul.go.kr/dataList/OA-18674/S/1/datasetView.do)
    - 강남구 소재 전체 음식점의 **리뷰 내역**을 카카오맵에서 `크롤링`
- 강남구 제공 데이터와 카카오맵 크롤링 데이터의 **데이터 불일치** 문제 발생
    - **상호명, 도로명주소**뿐만 아니라 **업종, 식당 키워드** 등을 추가 매핑하여 문제 해결
    - 데이터 클렌징 작업 수행
- 리뷰 작성자의 개인 성향에 의한 **평점 편향성 제거**
    - 다양한 개인별 성향 (e.g. 적은 평점, 후하거나 엄격한 성향 등)으로 인한 평점 왜곡 감소 및 일반화 목적
        - 10개 이상 작성한 사람의 리뷰로 제한
        - 식당별 리뷰 평점을 작성자별 평균 평점으로 나눗셈
    - **식당별 리뷰 개수**가 분석에 유의미한 수준으로 구성된 데이터만을 활용
#### EDA
- 강남구 모범 음식점 현황 (업종, 지역 등) 시각화
- 모범 음식점 vs 일반 음식점 평균 평점 차이에 따른 집단별 차이 식별

#### 가설 검정
1. 카카오맵 리뷰 없이 별점만 매긴 사람과 리뷰를 적은 사람의 평균 평점 차이가 있을까?
2. 중위값보다 리뷰를 적게 쓰는 집단과 많이 쓰는 집단의 평균 평점 차이가 있을까?
3. 강남구 모범 음식점과 일반 음식점의 평균 평점에는 유의미한 차이가 존재할까?
4. 강남구 평점 상위권 모범 음식점과 평점 상위권 일반 음식점의 평균 평점이 유의미한 차이를 갖고 있을까?
5. 상위권과 하위권 모범 음식점의 평균 평점이 일반 음식점보다 유의미하게 낮다면, 해당 식당은 모범 음식점으로의 자격이 없다고 볼 수 있지 않을까?

### 결과 도출 및 활용 방안
- 강남구 모범 음식점이 일반음식점에 비해 **뚜렷한 고객 만족을 창출해내지 못함**
    - 특히, 평점 상위권 식당들을 비교했을 때 모범 음식점의 고객 만족도가 일반 음식점보다 다소 뒤떨어지는 점 확인
- 강남구의 식품진흥기금, 골목 상권 형성 제도 등과 연계하여 **모범음식점 제도 개선** 필요 제기
- 궁극적으로, 신뢰도 높은 새로운 미식 기준으로서 강남구 모범 음식점 제도 재확립

<br />

---
<br />
<br />

## 23-24시즌 축구 선수 몸값 예측 모델링 (개선 예정)
- Transfermarkt 웹사이트에서 스크레이핑한 축구 스탯 데이터 [Kaggle Data URL](https://www.kaggle.com/datasets/davidcariboo/player-scores)
    - [GitHub Repository](https://github.com/benidjor/player-value-prediction-from-transfermarkt)
- `Python`, `Machine Learning`, `EDA`
### 분석 배경 및 목적
- 스포츠에서 통계 및 예측 모델의 중요성 증가
- 다양한 스포츠 통계 회사에서 정교한 예측 모형 제공 (ex. opta)
- 선수의 통계 자료를 바탕으로, 해당 시즌 예상되는 몸값을 예측하는 모델 만드는 것이 목표
- 데이터베이스 스키마
  ![데이터베이스 스키마](https://i.imgur.com/N9oXF1m.png)


### 분석 내용
#### 가설 설정
- 선수의 몸값에 영향을 가장 많이 주는 것은 공격 포인트 (골 + 어시스트)일 것이다
- 나이와 포지션에 따라, 비슷한 스탯이라도 선수의 몸값은 다를 것이다
- 전체 선수들의 분포에 비해, 고가의 선수들 (100M 유로 이상)의 몸값 분포는 다를 것이다

#### 분석 방법
1. Data Collection
   - Kaggle 데이터셋 다운로드 (대용량) → 별도 저장 후 전처리 → [data 폴더](https://github.com/benidjor/player-value-prediction-from-transfermarkt/tree/main/data)에 저장 
2. Data Preprocessing & EDA
    - `appearances` `competitions` `players` `player_valuations_df` 데이터셋 사용 \
    → `group by` 이후 `merge` 하여 새로운 데이터프레임 생성
    - 원본 데이터셋과 동일한 출처에서 가져온 [다른 데이터셋](https://www.kaggle.com/datasets/mexwell/football-data-from-transfermarkt?select=players.csv) 발견하여, `merge` 후 결측치 최대한 처리
   - 다중 공선성 확인 후 상관관계 높은 컬럼 제거
   - age, position, market_value, goals, assists 컬럼 시각화
3. Modeling
   - 19-20 시즌 부터 22-23 시즌까지의 데이터를 학습하여, 23-24 시즌 (37R 현재 진행중) 몸값을 예측하는 모델 생성
   - 범주형 변수 처리를 위해 `Target Encoding` 사용
   - Target인 몸값에 이상치가 많기 때문에, `RMSLE`를 우선적인 모델 평가 지표로 사용
   - 다양한 회귀 모델들을 비교하여, 하이퍼 파라미터 튜닝을 거친 후 `XGBoost`, `CatBoost`로 최적화
      - `XGBoost` 기반 모델
        - `RMSLE : 0.63`, `R2 Score : 0.78`
      - `CatBoost` 기반 모델
        - `RMSLE : 0.64`, `R2 Score : 0.82`
   - 예시: Transfermarkt 웹사이트의 23-24 시즌 손흥민 몸값 : 50,000,000 유로
       - `XGBoost` 기반 예측 몸값 : 58,188,860 유로
       - `CatBoost` 기반 예측 몸값 : 42,578,859 유로
### 개선 방안
- 향후 개선 계획
    - 경기중에 선수가 기록하는 세부적인 스탯을 제공하는 웹사이트를 크롤링하여, 다양한 스탯들을 반영하는 모델 생성
    - Feature Engineering, 하이퍼파라미터 튜닝 등을 통해 예측 모델 최적화
    - `RMSLE`와 `R2 Score` 중 우선 순위 명확하게 수립
    - [원본 Kaggle 데이터 페이지](https://www.kaggle.com/datasets/davidcariboo/player-scores) 에서 제공하는 [Github 페이지](https://github.com/dcaribou/transfermarkt-scraper) `scraper` 사용법을 숙지하여, 최신 버전의 데이터 다운로드 과정 자동화
    - 다운받은 데이터를 `BigQuery`에 적재하여, `SQL` 기반의 데이터 분석 및 대시보드 생성
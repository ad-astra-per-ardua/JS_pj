import pandas as pd
import requests
from JS_pj.settings import get_secret

files = {
    "남구": "대구광역시 남구_모범음식점 현황_20230809.csv",
    "북구": "대구광역시 북구_모범음식점_20230907.csv",
    "서구": "대구광역시 서구_모범음식점 현황_20230403.csv",
    "동구": "대구광역시_동구_모범음식점현황_20230406.csv",
    "수성구": "대구광역시_수성구 모범음식점 현황_20221206.csv"
}

dataframes = {}
for region, file_path in files.items():
    dataframes[region] = pd.read_csv(file_path, encoding='CP949')


def infer_cuisine_type(menu):
    if pd.isna(menu):
        return ''
    menu = menu.lower()
    if any(meat_dish in menu for meat_dish in ['갈비', '삼겹살', '고기', '구이']):
        return '식육(숯불구이)'
    elif any(korean_dish in menu for korean_dish in ['한식', '비빔밥', '국수', '찌개', '탕']):
        return '한식'
    elif '일식' in menu or '스시' in menu:
        return '일식'
    elif '중국' in menu or '짜장' in menu or '탕수육' in menu:
        return '중국식'
    elif '복어' in menu:
        return '복어취급'
    else:
        return ''

def geocode_address(address):
    naverapi = get_secret("NAVER_API_KEY_ID")
    naverpass = get_secret("NAVER_API_KEY_SECRET")

    url = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode'
    headers = {
        'X-NCP-APIGW-API-KEY-ID': naverapi,
        'X-NCP-APIGW-API-KEY': naverpass
    }
    params = {'query': address}

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    if 'addresses' in data and len(data['addresses']) > 0:
        latitude = data['addresses'][0]['y']
        longitude = data['addresses'][0]['x']
        return float(latitude), float(longitude)
    else:
        return None, None

for region, df in dataframes.items():
    if region in ['남구', '북구', '서구', '수성구']:
        df['도로명주소'] = df['소재지(도로명)'] if '소재지(도로명)' in df.columns else df['소재지도로명주소']
    elif region == '동구':
        df['도로명주소'] = df['주소']

    if '전화번호' not in df.columns:
        df['전화번호'] = df['소재지전화번호'] if '소재지전화번호' in df.columns else None

    df['전화번호'] = df['소재지전화번호'] if '소재지전화번호' in df.columns else df['전화번호']
    df['업태'] = df['업태명'] if '업태명' in df.columns else ''

    if region in ['남구', '서구', '동구'] and '대표메뉴' in df.columns:
        df['업태'] = df['대표메뉴'].apply(infer_cuisine_type)

    if '위도' not in df.columns:
        df['위도'] = None
    if '경도' not in df.columns:
        df['경도'] = None

    if region != '달서구':
        for idx, row in df.iterrows():
            if pd.isna(row['위도']) or pd.isna(row['경도']):
                latitude, longitude = geocode_address(row['도로명주소'])
                df.at[idx, '위도'] = latitude
                df.at[idx, '경도'] = longitude

    df = df[['업소명', '전화번호', '도로명주소', '업태', '위도', '경도']]
    dataframes[region] = df

for region, df in dataframes.items():
    output_file_path = f"converted/processed_{region}.csv"
    df.to_csv(output_file_path, index=False, encoding='utf-8-sig')

    print(f"{region} 데이터가 {output_file_path}에 저장되었습니다.")
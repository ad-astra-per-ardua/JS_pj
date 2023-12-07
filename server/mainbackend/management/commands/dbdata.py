from django.core.management.base import BaseCommand
from mainbackend.models import Restaurant
import pandas as pd

class Command(BaseCommand):
    help = '음식점 데이터를 데이터베이스에 저장합니다.'

    def handle(self, *args, **kwargs):
        files = {
            "남구": ("converted/processed_남구.csv", 'EUC-KR'),
            "북구": ("converted/processed_북구.csv", 'UTF-8-SIG'),
            "서구": ("converted/processed_서구.csv", 'EUC-KR'),
            "동구": ("converted/processed_동구.csv", 'EUC-KR'),
            "달서구": ("converted/processed_달서구.csv", 'CP949'),
            "수성구": ("converted/processed_수성구.csv", 'UTF-8-SIG')
        }

        dataframes = {}
        for region, (file_path, encoding) in files.items():
            df = pd.read_csv(file_path, encoding=encoding)
            dataframes[region] = df

        def save_to_database(df, region):
            for _, row in df.iterrows():
                if '비정좌표' in str(row['위도']) or '비정좌표' in str(row['경도']):
                    continue

                Restaurant.objects.create(
                    name=row['업소명'],
                    phone_number=row['전화번호'] if pd.notna(row['전화번호']) else '',
                    address=row['도로명주소'] if pd.notna(row['도로명주소']) else '',
                    cuisine_type=row['업태'],
                    latitude=row['위도'],
                    longitude=row['경도']
                )

        # 각 구별 데이터 저장
        for region, df in dataframes.items():
            save_to_database(df, region)

            self.stdout.write(self.style.SUCCESS('데이터가 성공적으로 저장되었습니다.'))

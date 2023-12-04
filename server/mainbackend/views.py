from django.contrib.sites import requests
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import Restaurant
import requests
import logging,ast
import json
from django.views.decorators.csrf import csrf_exempt
import urllib.request

logger = logging.getLogger(__name__)


@csrf_exempt
def create_naver_directions_link(request):
    try:
        naverapi = get_secret("NAVER_API_KEY_ID")
        naverpass = get_secret("NAVER_API_KEY_SECRET")
        start_latitude = request.GET.get('start_latitude')
        start_longitude = request.GET.get('start_longitude')
        end_latitude = request.GET.get('end_latitude')
        end_longitude = request.GET.get('end_longitude')

        start = (start_latitude, start_longitude)
        goal = (end_latitude, end_longitude)

        client_id = naverapi
        client_secret = naverpass

        url = f"https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving?start={start[1]},{start[0]}&goal={goal[1]},{goal[0]}"

        request = urllib.request.Request(url)
        request.add_header('X-NCP-APIGW-API-KEY-ID', client_id)
        request.add_header('X-NCP-APIGW-API-KEY', client_secret)

        response = urllib.request.urlopen(request)
        response_body = response.read().decode('utf-8')
        logger.info(f"API Response: {response_body}")
        data = json.loads(response_body)
        # final_url = data.get('route', {}).get('traoptimal', {}).get('summary', {}).get('route_url', '')
        logger.debug(f"API Response: {data}")

        return JsonResponse({'result': 'success', 'data': data})

    except Exception as e:
        return JsonResponse({'result': 'error', 'message': str(e)})

@csrf_exempt
def route_link(request):
    try:
        start_x = request.GET.get('start_x', None)
        start_y = request.GET.get('start_y', None)
        end_x = request.GET.get('end_x', None)
        end_y = request.GET.get('end_y', None)
        is_mobile = int(request.GET.get('mobile', None))
        start_name = request.GET.get('start_name')
        end_name = request.GET.get('end_name')

        url = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving"

        headers = {
            'X-NCP-APIGW-API-KEY-ID': get_secret("NAVER_API_KEY_ID"),
            'X-NCP-APIGW-API-KEY': get_secret("NAVER_API_KEY_SECRET"),
        }

        params = {
            'start': f"{start_x},{start_y}",
            'goal': f"{end_x},{end_y}",
        }

        if is_mobile:
            final_url = f"https://m.search.naver.com/search.naver?query=%EB%B9%A0%EB%A5%B8%EA%B8%B8%EC%B0%BE%EA%B8%B0&nso_path=placeType%5Eplace%3Bname%5E출발지%3Baddress%5E%3Blongitude%5E{start_x}%3Blatitude%5E{start_y}%3Bcode%5E%7Ctype%5Eplace%3Bname%5E도착지%3Baddress%5E%3Blongitude%5E{end_x}%3Blatitude%5E{end_y}%3Bcode%5E%7Cobjtype%5Epath%3Bby%5Epubtrans"
        else:
            final_url = f"http://map.naver.com/index.nhn?slng={start_x}&slat={start_y}&stext={start_name}&elng={end_x}&elat={end_y}&pathType=0&showMap=true&etext={end_name}&menu=rout"

        logger.debug(f"Final URL: {final_url}")

        return JsonResponse({'result': 'success', 'route_url': final_url})

    except Exception as e:
        return JsonResponse({'result': 'error', 'message': str(e)})

def get_all_restaurants(request):
    markets = Restaurant.objects.all().values('name', 'address', 'latitude', 'longitude')
    markets_list = list(markets)
    return JsonResponse({'markets': markets_list})


def geocode_address(address):
    naverapi = get_secret("NAVER_API_KEY_ID")
    naverpass = get_secret("NAVER_API_KEY_SECRET")
    # Use Naver's Geocoding API
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


def secret(request):
    NAVER_API_KEY_ID = get_secret("NAVER_API_KEY_ID")
    return render(request, 'index.html', {'NAVER_API_KEY_ID': NAVER_API_KEY_ID})


def get_naver_directions(request):
    start_latitude = request.GET.get('start_latitude')
    start_longitude = request.GET.get('start_longitude')
    end_latitude = request.GET.get('end_latitude')
    end_longitude = request.GET.get('end_longitude')
    start_name = request.GET.get('start_name', '내 위치')
    end_name = request.GET.get('end_name')

    link = f"https://map.naver.com/v5/directions/{start_latitude},{start_longitude},{start_name}/{end_latitude},{end_longitude},{end_name}/"
    return JsonResponse({'link': link})


def save_to_database(df, region):
    for _, row in df.iterrows():
        Restaurant.objects.create(
            name=row['업소명'],
            phone_number=row['전화번호'] if pd.notna(row['전화번호']) else '',
            address=row['도로명주소'] if pd.notna(row['도로명주소']) else '',
            cuisine_type=row['업태'],
            latitude=row['위도'],
            longitude=row['경도']
        )
    for region, df in dataframes.items():
        save_to_database(df, region)
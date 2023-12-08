from django.contrib.sites import requests
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from .models import Restaurant
from JS_pj.settings import get_secret
import requests
import logging,ast
import json
from django.views.decorators.csrf import csrf_exempt
import urllib.request
from django.contrib.admin.utils import quote
from django.core.paginator import Paginator

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
        end_name = request.GET.get('end_name')

        if is_mobile:
            final_url = f"https://m.search.naver.com/search.naver?query=%EB%B9%A0%EB%A5%B8%EA%B8%B8%EC%B0%BE%EA%B8%B0&nso_path=placeType%5Eplace%3Bname%5E출발지%3Baddress%5E%3Blongitude%5E{start_x}%3Blatitude%5E{start_y}%3Bcode%5E%7Ctype%5Eplace%3Bname%5E도착지%3Baddress%5E%3Blongitude%5E{end_x}%3Blatitude%5E{end_y}%3Bcode%5E%7Cobjtype%5Epath%3Bby%5Epubtrans"
        else:
            final_url = f"http://map.naver.com/index.nhn?slng={start_x}&slat={start_y}&stext={'내 위치'}&elng={end_x}&elat={end_y}&pathType=0&showMap=true&etext={'목적지'}&menu=rout"

        logger.debug(f"Final URL: {final_url}")

        return JsonResponse({'result': 'success', 'route_url': final_url})

    except Exception as e:
        return JsonResponse({'result': 'error', 'message': str(e)})


def filtered(request):
    district = request.GET.get('district', '')
    page = request.GET.get('page', 1)
    restaurants_list = Restaurant.objects.all().order_by('name')  # 정렬 추가

    if district:
        restaurants_list = restaurants_list.filter(address__icontains=district)

    paginator = Paginator(restaurants_list, 3)  # 페이지당 5개 항목
    try:
        restaurants = paginator.page(page)
    except PageNotAnInteger:
        restaurants = paginator.page(1)
    except EmptyPage:
        restaurants = paginator.page(paginator.num_pages)

    restaurants_data = list(restaurants.object_list.values('name', 'address', 'phone_number', 'cuisine_type'))

    return JsonResponse({
        'markets': restaurants_data,
        'total_pages': paginator.num_pages
    }, safe=False, json_dumps_params={'ensure_ascii': False})

def get_all_restaurants(request):
    markets = Restaurant.objects.all().values('name', 'address', 'latitude', 'longitude', 'phone_number','cuisine_type')
    markets_list = list(markets)
    return JsonResponse({'markets': markets_list}, safe=False, json_dumps_params={'ensure_ascii': False})


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


def index(request):
    district = request.GET.get('district', '')
    restaurants_list = Restaurant.objects.all()

    if district:
        restaurants_list = restaurants_list.filter(address__icontains=district)

    paginator = Paginator(restaurants_list, 5)
    page = request.GET.get('page')
    restaurants = paginator.get_page(page)

    districts = ['남구', '북구', '서구', '동구', '달서구', '수성구']
    return render(request, 'index.html', {'restaurants': restaurants, 'districts': districts})

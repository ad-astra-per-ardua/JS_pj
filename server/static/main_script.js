var end_x = 126.972559;
var end_y = 37.555062;
var markers = {};
var userPosition = null;
var map;

function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      userPosition = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
      var mapOptions = {
        center: userPosition,
        zoom: 17,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: true,
        overlayType: 'bg.ol.ts.ctt.lko',
      };
      map = new naver.maps.Map('map', mapOptions);
      new naver.maps.Marker({
        position: userPosition,
          overlayType: 'bg.ol.ts.ctt.lko',
        map: map
      });

      // 모든 시장을 지도에 표시
      showAllRestaurants(map);
      showShopsInMarket(map)

    }, function(err) {
      console.error(err);
    });
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
}
document.addEventListener('DOMContentLoaded', initMap);
var openedInfowindow = null;

function viewDetails(marketName) {
    window.location.href = `/details/${encodeURIComponent(marketName)}`;
}
function createMarkerWithInfo(market, map) {
    const position = new naver.maps.LatLng(market.latitude, market.longitude);
    const marker = new naver.maps.Marker({
        position: position,
        map: map,
        title: market.name
    });

    const content = `
    <div style="position: relative; text-align: center; border-radius: 10px; padding: 10px;">
        <div style="font-size: 16px; margin-bottom: 5px;">${market.name}</div>
        <div style="font-size: 12px; color: #333; margin-bottom: 10px;">주소: ${market.address}</div>
        <button onclick="getDirectionsToRestaurant({name: '${market.name}', latitude: ${market.latitude}, longitude: ${market.longitude}})">길찾기</button>
        <button onclick="viewDetails('${market.name}')" style="margin-left: 10px;">상세보기</button>
        <div style="position: absolute; top: 5px; right: 5px; cursor: pointer;" onclick="closeInfowindow()">X</div>
    </div>
    `;

    const infowindow = new naver.maps.InfoWindow({
        content: content
    });

    naver.maps.Event.addListener(marker, 'click', function () {
        if (openedInfowindow) {
            openedInfowindow.close();
        }
        infowindow.open(map, marker);
        openedInfowindow = infowindow;
    });

    // 마커를 markers 객체에 저장
    markers[market.name] = marker;
}


// 지도를 클릭했을 때의 이벤트
    naver.maps.Event.addListener(map, 'click', function () {
        if (openedInfowindow) {  // 이미 열린 정보창이 있다면
            openedInfowindow.close();  // 그 정보창을 닫는다
            openedInfowindow = null;  // 열린 정보창 변수를 초기화한다
        }
    });
function closeInfowindow() {
    if (openedInfowindow) {
        openedInfowindow.close();
        openedInfowindow = null;
    }
}

function showAllRestaurants(map) {
    fetch(`/api/get_all_restaurants/`)
        .then(response => response.json())
        .then(data => {
            let markets = data.markets;

            for (const market of markets) {
                createMarkerWithInfo(market, map);
            }
        });
}
function moveAndRemoveMarker(marketName) {
  if (markers[marketName]) {
    map.setCenter(markers[marketName].getPosition());
    markers[marketName].setMap(null);
    delete markers[marketName];
  } else {
    console.error("마커를 찾을 수 없습니다.");
  }
}

function showShopsInMarket(map) {
  fetch(`/api/get_shops/`)
    .then(response => response.json())
    .then(data => {
      let shops = data.shops
        for (const shop of shops) {
                createShopMarker(shop, map);
            }
    });
}


function createShopMarker(shop, map) {
  const shopPosition = new naver.maps.LatLng(shop.latitude, shop.longitude);
  const shopMarker = new naver.maps.Marker({
    position: shopPosition,
    map: map,
    title: shop.shop_name,
    icon: {
      url: 'https://icons.iconarchive.com/icons/emey87/trainee/16/Gps-icon.png',
      scaledSize: new naver.maps.Size(25, 25)
    }
  });

  const infowindowContent = `
    <div style="position: relative; text-align: left; border-radius: 10px; padding: 10px; display: flex; flex-direction: column;">
  <div style="display: flex; justify-content: start; align-items: center; margin-bottom: 10px;">
    <div style="font-size: 16px; margin-right: 10px;"><strong>${shop.shop_name}</strong></div>
    <div style="font-size: 12px; color: #555;"><strong>분류:</strong>${shop.shop_category}(${shop.main_products})</div>
  </div>
  <div style="font-size: 14px; text-align: center; color: #333; margin-bottom: 10px;">주소: ${shop.road_address}</div>
  <div style="text-align: center;">
    <button onclick="getDirectionsToRestaurant({name: '${shop.shop_name}', latitude: ${shop.latitude}, longitude: ${shop.longitude}})">길찾기</button>
    <button onclick="viewDetails('${shop.shop_name}')" style="margin-left: 10px;">상세보기</button>
  </div>
  <div style="position: absolute; top: 5px; right: 5px; cursor: pointer;" onclick="closeInfowindow()">X</div>
</div>


  `;
  const infowindow = new naver.maps.InfoWindow({
    content: infowindowContent
  });
  naver.maps.Event.addListener(shopMarker, 'click', function() {
    if (openedInfowindow) {
      openedInfowindow.close();
    }
    infowindow.open(map, shopMarker);
    openedInfowindow = infowindow;
  });

  console.log(shopMarker);
}
document.addEventListener('DOMContentLoaded', function() {
  initMap();
  attachMarketButtonListeners();
});

    function getDirectionsToRestaurant(restaurant) {
        if (userPosition) {
            const startLat = userPosition.lat();
            const startLng = userPosition.lng();
            const endLat = restaurant.latitude;
            const endLng = restaurant.longitude;
            const is_mobile = isMobile();

            console.log(is_mobile);

            $.ajax({
                url: `/route_link/`,
                type: "GET",
                data: {
                    start_x: startLng,
                    start_y: startLat,
                    end_x: endLng,
                    end_y: endLat,
                    mobile: is_mobile,
                },
                success: function (data) {
                    if (data.result === "success") {
                        window.open(data.route_url, '_blank');
                    } else {
                        alert('길찾기를 실패했습니다.');
                    }
                }
            });
        } else {
            alert("사용자 위치를 먼저 설정해주세요.");
        }
    }

//사용자의 접속 클라이언트 확인
    function isMobile() {
        //화면의 너비가 768 픽셀 미만이면 모바일로 간주
        if (window.innerWidth <= 768) {
            result = 1
        } else {
            result = 0
        }
        return result;
    }

    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                start_x = pos.lng;
                start_y = pos.lat;
                findRoute(start_x, start_y, end_x, end_y);
            });
        }
    }

    function findRoute(start_x, start_y, end_x, end_y) {
        // Django의 route_link 함수를 호출
        $.ajax({
            url: "/route_link/",
            type: "GET",
            data: {
                start_x: start_x,
                start_y: start_y,
                end_x: end_x,
                end_y: end_y
            },
            success: function (data) {
                if (data.result === "success") {
                } else {
                }
            }
        });
    }


// Haversine

    function toRadians(degree) {
        return degree * (Math.PI / 180);
    }
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const csrftoken = getCookie('csrftoken');

    document.addEventListener("DOMContentLoaded", function () {
        getCurrentLocation();
        showAllRestaurants();
        document.body.addEventListener("click", function (event) {
            if (event.target.classList.contains("detail-button")) {
                const restaurantId = event.target.getAttribute("data-id");
                if (restaurantId) {
                    navigateToDetail(restaurantName);
                } else {
                    console.error("restaurantId가 정의되지 않았습니다.");
                }
            }
        });
    })



function attachMarketButtonListeners() {
  const marketButtons = document.querySelectorAll('header button');
  marketButtons.forEach(button => {
    button.addEventListener('click', function() {
      const marketName = this.dataset.marketName;
      moveAndRemoveMarker(marketName);
      showShopsInMarket(marketName);
    });
  });
}
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
        map: map,
        icon: {
          url: '/static/assets/map_pin_user_icon_206536.png',
          size: new naver.maps.Size(40, 40),
          origin: new naver.maps.Point(0, 0),
          anchor: new naver.maps.Point(20, 20)
        }
      });
      // 모든 시장을 지도에 표시
      showAllRestaurants(map);
      showFilteredRestaurants()


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
      // for debugging
    const position = new naver.maps.LatLng(market.latitude, market.longitude);
    const marker = new naver.maps.Marker({
        position: position,
        map: map,
        title: market.name
    });
    const phoneNumber = market.phone_number ? market.phone_number : "정보 없음";
    const cuisineType = market.cuisine_type ? market.cuisine_type : "정보 없음";


    const content = `
    <div style="position: relative; text-align: center; border-radius: 10px; padding: 10px;">
        <div style="font-size: 16px; margin-bottom: 5px;">${market.name}</div>
        <div style="font-size: 12px; color: #333; margin-bottom: 10px;"><strong>주소:</strong> ${market.address}</div>
        <div style="font-size: 12px; color: #333; margin-bottom: 10px;"><strong>전화번호:</strong> ${phoneNumber} <strong>업태 or 대표메뉴:</strong> ${cuisineType}</div>
        <button onclick="getDirectionsToRestaurant({name: '${market.name}', latitude: ${market.latitude}, longitude: ${market.longitude}})">길찾기</button>
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
function closeInfowindow() {
    if (openedInfowindow) {
        openedInfowindow.close();
        openedInfowindow = null;
    }
}

function loadRestaurants(page) {
    var selectedDistrict = $('#districtSelect').val();

    $.ajax({
        url: '/api/filtered/',
        type: 'GET',
        data: {
            'district': selectedDistrict,
            'page': page
        },
        success: function(data) {
            updateRestaurantsContainer(data.markets);
            showFilteredRestaurants(data, map); // 데이터 전체를 전달
            updatePagination(data.total_pages, page);
        },
        error: function(error) {
            console.error(error);
        }
    });
}

function addClickEventsToRestaurants(data) {
    data.forEach(function(restaurant) {
        attachClickEventToRestaurant(restaurant);
    });
}

function attachClickEventToRestaurant(restaurant) {
    var restaurantElement = document.getElementById('restaurant-' + restaurant.name); // 예: 각 음식점 요소의 ID는 'restaurant-음식점명'
    restaurantElement.addEventListener('click', function() {
        simulateMarkerClick(restaurant.name);
    });
}

function simulateMarkerClick(restaurantName) {
    if (markers[restaurantName]) {
        new google.maps.event.trigger(markers[restaurantName], 'click');
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
            addClickEventsToRestaurants(markets)
        });
}

document.addEventListener('DOMContentLoaded', function() {
  initMap();
});

function showFilteredRestaurants(data, map) {
    clearMarkers();
    if (data.markets && data.markets.length > 0) {
        data.markets.forEach(function(restaurant) {
            createMarkerWithInfo(restaurant, map);
        });
    }
}



function clearMarkers() {
    for (var key in markers) {
        if (markers.hasOwnProperty(key)) {
            markers[key].setMap(null);
        }
    }
    markers = {};
}



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
        // Call django route function
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
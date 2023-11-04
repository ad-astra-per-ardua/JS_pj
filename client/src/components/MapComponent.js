import React, { useState, useEffect, useRef } from 'react';

const MapComponent = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [openedInfowindow, setOpenedInfowindow] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [userMarkerPosition, setUserMarkerPosition] = useState(null);

  // 지도 초기화
  useEffect(() => {
    const mapInstance = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(33.4773085, 126.3628347),
      zoom: 12,
      mapTypes: new window.naver.maps.MapTypeRegistry({
        'normal': window.naver.maps.NaverStyleMapTypeOptions.getNormalMap({
          overlayType: 'bg.ol.ts.ctt.lko'
        })
      })
    });
    setMap(mapInstance);
  }, []);

  // 레스토랑 데이터 가져오기 및 마커 생성
  const fetchRestaurants = () => {
    fetch('/api/get_all_restaurants/')
      .then(response => response.json())
      .then(data => {
        data.restaurants.forEach(restaurant => {
          createMarkerWithInfo(restaurant);
        });
      });
  };

  // 마커와 정보창 생성
  const createMarkerWithInfo = (restaurant) => {
    const position = new window.naver.maps.LatLng(restaurant.latitude, restaurant.longitude);
    const marker = new window.naver.maps.Marker({
      position,
      map,
      title: restaurant.name,
    });

    const contentString = `<div class="info-window-content">
      <h3>${restaurant.name}</h3>
      <p>${restaurant.menu}</p>
      
    </div>`;

    const infowindow = new window.naver.maps.InfoWindow({
      content: contentString,
      borderWidth: 0,
      backgroundColor: 'transparent'
    });

    window.naver.maps.Event.addListener(marker, 'click', () => {
      if (openedInfowindow) {
        openedInfowindow.close();
      }
      infowindow.open(map, marker);
      setOpenedInfowindow(infowindow);
    });

    setMarkers(prevMarkers => [...prevMarkers, marker]);
  };

  // 사용자 위치 표시
    const showUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const userPosition = new window.naver.maps.LatLng(userLat, userLon);
        setUserMarkerPosition(userPosition);

        if (userMarker) {
          userMarker.setPosition(userPosition);
        } else {
          const newUserMarker = new window.naver.maps.Marker({
            position: userPosition,
            map: map,

            icon: {
              url: 'https://icons.iconarchive.com/icons/emey87/trainee/16/Gps-icon.png',
              scaledSize: new window.naver.maps.Size(25, 25)
            },
            draggable: true
          });
          setUserMarker(newUserMarker);

          window.naver.maps.Event.addListener(newUserMarker, 'dragend', function (event) {
            const newPosition = event.coord;
            setUserMarkerPosition(newPosition);
            showNearestRestaurants(newPosition.lat(), newPosition.lng());
          });
        }

        map.setCenter(userPosition);
      }, (error) => {
        console.error('Geolocation service failed:', error);
      });
    } else {
      console.error('Geolocation not supported by this browser.');
    }
  };
  const showNearestRestaurants = (lat, lng) => {
  fetch('/api/get_all_restaurants/')
    .then(response => response.json())
    .then(data => {
      const restaurants = data.restaurants.map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(lat, lng, restaurant.latitude, restaurant.longitude)
      }));

      restaurants.sort((a, b) => a.distance - b.distance);

      // TODO : Update nearest Restaurants

    })
    .catch(error => {
      console.error('Error fetching restaurants:', error);
    });
};


  const getDirectionsToRestaurant = (restaurant) => {
    // TODO: Backend API
  };

const getCurrentLocationAndFindRoute = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const currentPos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      findRoute(currentPos.lat, currentPos.lng, end_x, end_y);
    }, (error) => {
      console.error("Geolocation service failed:", error);
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
};


const findRoute = (startLat, startLng, endLat, endLng) => {
  const apiUrl = "/route_link/";

  const requestData = {
    start_x: startLng,
    start_y: startLat,
    end_x: endLng,
    end_y: endLat
  };

  // Fetch API
  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.result === "success") {
      console.log("Route found:", data);
    } else {
      console.error("Failed to find route:", data);
    }
  })
  .catch(error => {
    console.error("Error fetching route:", error);
  });
};

  // Haversine Formular
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = degree => degree * (Math.PI / 180);

    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    lat1 = toRadians(lat1);
    lat2 = toRadians(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  // 첫 렌더링 시 레스토랑 데이터 가져오기 및 사용자 위치 표시
  useEffect(() => {
    fetchRestaurants();
    showUserLocation();
  }, [map]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '400px' }}>
      {/* Add JSX Element in here . */}
    </div>
  );
};

export default MapComponent;

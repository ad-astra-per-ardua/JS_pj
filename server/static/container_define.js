$(document).ready(function() {
    loadRestaurants(1);

    $('#districtSelect').change(function() {
        loadRestaurants(1);
    });
});

function loadRestaurants(page) {
    var selectedDistrict = $('#districtSelect').val();

    $.ajax({
        url: '/api/get_all_restaurants/',
        type: 'GET',
        data: {
            'district': selectedDistrict,
            'page': page
        },
        success: function(data) {
            updateRestaurantsContainer(data.markets);
            showFilteredRestaurants(data.markets, map);
            updatePagination(data.total_pages, page);
        },
        error: function(error) {
            console.error(error);
        }
    });
}


function updateRestaurantsContainer(restaurants) {
    var container = document.getElementById('restaurantsContainer');
    container.innerHTML = '';

    restaurants.forEach(function(restaurant) {
    var div = document.createElement('div');
    div.classList.add('restaurant-item');
    div.innerHTML = `
        <h3>${restaurant.name}</h3>
        <p>${restaurant.address}</p>
        <p>${restaurant.phone_number}</p>
        <p>대표메뉴 or 업태 : ${restaurant.cuisine_type}</p>`;
    container.appendChild(div);
});

}

function filterRestaurants() {
    var selectedDistrict = document.getElementById('districtSelect').value;

    $.ajax({
        url: '/api/filtered/',
        type: 'GET',
        data: {
            'district': selectedDistrict
        },
        success: function(data) {
            updateRestaurantsContainer(data.markets);
        },
        error: function(error) {
            console.error(error);
        }
    });
}

function updatePagination(totalPages, currentPage) {
    var paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    // 시작 페이지와 종료 페이지를 설정
    var startPage = Math.max(1, currentPage - 4);
    var endPage = Math.min(totalPages, currentPage + 4);

    // 시작 페이지가 1이 아닐 경우 첫 페이지와 '...'를 추가
    if (startPage > 1) {
        paginationContainer.appendChild(createPageLink(1));
        paginationContainer.appendChild(createPageEllipsis());
    }

    // 페이지 링크 생성
    for (var i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createPageLink(i, currentPage === i));
    }

    // 마지막 페이지가 총 페이지 수보다 작을 경우 '...'와 마지막 페이지를 추가
    if (endPage < totalPages) {
        paginationContainer.appendChild(createPageEllipsis());
        paginationContainer.appendChild(createPageLink(totalPages));
    }
}

function createPageLink(page, isActive = false) {
    var pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.innerText = page;
    pageLink.onclick = function(e) {
        e.preventDefault();
        loadRestaurants(page);
    };

    if (isActive) {
        pageLink.classList.add('active');
    }

    return pageLink;
}

function createPageEllipsis() {
    var ellipsis = document.createElement('span');
    ellipsis.innerText = '...';
    return ellipsis;
}

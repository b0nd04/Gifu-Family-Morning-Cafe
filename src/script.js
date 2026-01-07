document.addEventListener('DOMContentLoaded', () => {
    let stores = [];

    // Elements
    const storeListEl = document.getElementById('store-list');
    const resultCountEl = document.getElementById('result-count');
    const filterKidsMenu = document.getElementById('filter-kids-menu');
    // REMOVED: filterHighChair, filterNearbyParking
    const filterParkingDifficulty = document.getElementById('filter-parking-difficulty');
    const filterCarType = document.getElementById('filter-car-type');

    // Fetch Data
    fetchStores()
        .then(data => {
            stores = data;
            renderStores(stores);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            storeListEl.innerHTML = '<p class="text-red-500 text-center col-span-3">データの読み込みに失敗しました。</p>';
        });

    // Event Listeners for Filters
    const inputs = [filterKidsMenu, filterParkingDifficulty, filterCarType];
    inputs.forEach(input => {
        if (input) input.addEventListener('change', applyFilters);
    });

    function applyFilters() {
        const criteria = {
            kidsMenu: filterKidsMenu.checked,
            parkingDiff: filterParkingDifficulty.value, // Changed to value
            carType: filterCarType.value
        };

        const filtered = stores.filter(store => {
            if (criteria.kidsMenu && !store.has_kids_menu) return false;

            // NEW: Parking Difficulty Filter (Cumulative)
            if (criteria.parkingDiff !== 'all') {
                const rawDiff = store.parking_difficulty;
                const diff = Array.isArray(rawDiff) ? rawDiff[0] : rawDiff;
                const target = criteria.parkingDiff;

                if (target === '易') {
                    // Only Easy
                    if (diff !== '易') return false;
                } else if (target === '普') {
                    // Easy or Normal (Reject Difficult)
                    if (diff === '難') return false;
                }
                // If target is '難', accept everything (Easy, Normal, Difficult)
            }

            if (criteria.carType !== 'all') {
                const userCar = criteria.carType;
                const rawStoreType = store.parking_size_type;
                const storeType = Array.isArray(rawStoreType) ? rawStoreType[0] : rawStoreType;

                if (userCar === 'Large/Minivan') {
                    return storeType === 'Large/Minivan';
                }
                if (userCar === 'Normal') {
                    return storeType === 'Large/Minivan' || storeType === 'Normal';
                }
                if (userCar === 'Light only') {
                    return true;
                }
            }
            return true;
        });

        renderStores(filtered);
    }

    function renderStores(data) {
        resultCountEl.textContent = `検索結果: ${data.length}件`;
        storeListEl.innerHTML = '';

        if (data.length === 0) {
            storeListEl.innerHTML = `
                <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
                    <p class="text-xl mb-2">条件に一致するお店が見つかりませんでした 😢</p>
                    <p>条件を少し緩めて再度検索してみてください。</p>
                </div>
            `;
            return;
        }

        data.forEach(store => {
            // Badges (Updated based on request)
            let badges = '';

            // 1. Kids Menu
            if (store.has_kids_menu) {
                badges += `<span class="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">👶 キッズメニュー</span>`;
            }

            // 2. Parking Difficulty (Replacing High Chair)
            const diff = Array.isArray(store.parking_difficulty) ? store.parking_difficulty[0] : store.parking_difficulty;
            if (diff === '易') {
                badges += `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">🚙 停めやすい</span>`;
            }

            // 3. Parking Size Tags (Replacing Minivan/Light logic slightly visually)
            const parkingSize = Array.isArray(store.parking_size_type) ? store.parking_size_type[0] : store.parking_size_type;
            if (parkingSize === 'Large/Minivan') {
                badges += `<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">大型可</span>`;
            } else if (parkingSize === 'Light only') {
                badges += `<span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">軽のみ</span>`;
            }

            // Parking Info coloration
            let parkingColor = 'text-gray-600';
            if (diff === '易') parkingColor = 'text-green-600 font-bold'; // Highlight easy parking

            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer';

            // Navigate to detail page on click
            card.addEventListener('click', () => {
                window.location.href = `detail.html?id=${store.id}`;
            });

            card.innerHTML = `
                <div class="relative h-48 bg-gray-200">
                    <img src="${store.image.url}" alt="${store.name}" class="w-full h-full object-cover">
                    <div class="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        ★ ${store.rating}
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${store.name}</h3>
                    <p class="text-sm text-gray-500 mb-4 line-clamp-2">${store.description}</p>
                    
                    <div class="mb-4">
                        ${badges}
                    </div>

                    <div class="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-400 text-xs mb-0.5">駐車場</p>
                            <p class="${parkingColor}">${store.parking_count}台 (${translateParking(parkingSize)})</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-xs mb-0.5">Wi-Fi</p>
                            <p class="text-gray-600">${store.has_wifi ? 'あり' : 'なし'}</p>
                        </div>
                    </div>
                </div>
            `;
            storeListEl.appendChild(card);
        });
    }

    function translateParking(type) {
        if (type === 'Large/Minivan') return '大型可';
        if (type === 'Normal') return '中型まで';
        if (type === 'Light only') return '軽推奨';
        return type;
    }
});

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
                badges += `<span class="inline-block bg-orange-100 text-orange-800 px-2 py-1 text-[10px] tracking-wider font-bold">👶 キッズメニュー</span>`;
            }

            // 2. Parking Difficulty
            const diff = Array.isArray(store.parking_difficulty) ? store.parking_difficulty[0] : store.parking_difficulty;
            if (diff === '易') {
                badges += `<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-[10px] tracking-wider font-bold">🚙 停めやすい</span>`;
            }

            // 3. Parking Size Tags
            const parkingSize = Array.isArray(store.parking_size_type) ? store.parking_size_type[0] : store.parking_size_type;
            if (parkingSize === 'Large/Minivan') {
                badges += `<span class="inline-block bg-green-100 text-green-800 px-2 py-1 text-[10px] tracking-wider font-bold">大型可</span>`;
            } else if (parkingSize === 'Light only') {
                badges += `<span class="inline-block bg-red-100 text-red-800 px-2 py-1 text-[10px] tracking-wider font-bold">軽のみ</span>`;
            }

            // Parking Info coloration
            let parkingColor = 'text-gray-600';
            if (diff === '易') parkingColor = 'text-green-600 font-bold'; // Highlight easy parking

            const card = document.createElement('div');
            card.className = 'group cursor-pointer flex flex-col h-full';

            // Navigate to detail page on click
            card.addEventListener('click', () => {
                window.location.href = `detail.html?id=${store.id}`;
            });

            // Modern Editorial Card Layout
            card.innerHTML = `
                <div class="relative overflow-hidden mb-6 bg-gray-100 aspect-[4/3]">
                    <img src="${store.image.url}" alt="${store.name}" class="w-full h-full object-cover transition duration-700 ease-out group-hover:scale-105 group-hover:sepia-[.2]">
                    <div class="absolute top-0 right-0 bg-black text-white px-3 py-2 border-b border-l border-white text-xs font-bold tracking-widest z-10">
                        ★ ${store.rating}
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col">
                    <div class="mb-3 flex flex-wrap gap-2">
                         ${badges}
                    </div>
                    
                    <h3 class="text-2xl font-serif font-bold text-brand-black mb-3 leading-tight group-hover:underline decoration-1 underline-offset-4 transition decoration-gray-400">
                        ${store.name}
                    </h3>
                    
                    <p class="text-gray-600 font-serif italic text-sm mb-6 line-clamp-2 leading-relaxed">
                        ${store.description}
                    </p>
                    
                    <div class="mt-auto pt-4 border-t border-gray-200 flex justify-between items-end text-xs uppercase tracking-widest font-bold text-gray-400">
                        <div>
                            <span class="block text-brand-black mb-1">台数</span>
                            ${store.parking_count}台
                        </div>
                         <div class="text-right">
                             <span class="block text-brand-black mb-1">サイズ</span>
                             ${translateParking(parkingSize)}
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

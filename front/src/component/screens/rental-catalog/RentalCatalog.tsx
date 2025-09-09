import { useDateRange } from "@/component/hooks/catalog-rental/useDateRange";
import { useRentals } from "@/component/hooks/catalog-rental/useRentals";
import axios from "axios";
import { useTranslation } from "react-i18next";
import RentalDatePicker from "./rental-date/RentalDatePicker";
import LoadingIndicator from "./loading/LoadingIndicator";
import RentalMap from "./rental-map/RentalMap";
import { useState, useEffect } from "react";
import { IHouse } from "@/component/type/properties.interface";
import { apiUrl, mediaUrl } from "@/utils/url";

export default function RentalCatalog() {
  const { t } = useTranslation();
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();
  const { rentals, loading, fetchData } = useRentals(startDate, endDate);
  
  // Фильтры
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    propertyType: "",
    minRooms: "",
    maxRooms: "",
    isFurnished: false,
    hasBalcony: false,
  });

  // Выбранная недвижимость для боковой панели
  const [selectedHouse, setSelectedHouse] = useState<IHouse | null>(null);
  // Индекс главного изображения
  const [mainImgIdx, setMainImgIdx] = useState(0);

  useEffect(() => {
    setMainImgIdx(0);
  }, [selectedHouse]);

  const handleRent = (houseId: number) => {
    if (!startDate || !endDate) {
      alert(t("rentalCatalog.selectDates"));
      return;
    }
    axios
      .post(
        apiUrl("/rent-house/"),
        {
          house_id: houseId,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )
      .then(() => alert(t("rentalCatalog.requestSent")))
      .catch(() => alert(t("rentalCatalog.requestFailed")));
  };

  // Применение фильтров к данным
  const filteredRentals = rentals.filter((rental) => {
    if (filters.minPrice && parseFloat(rental.price) < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && parseFloat(rental.price) > parseFloat(filters.maxPrice)) return false;
    if (filters.propertyType && rental.type_p !== filters.propertyType) return false;
    if (filters.minRooms && rental.num_of_rooms < parseInt(filters.minRooms)) return false;
    if (filters.maxRooms && rental.num_of_rooms > parseInt(filters.maxRooms)) return false;
    if (filters.isFurnished && !rental.is_furnished) return false;
    if (filters.hasBalcony && !rental.has_balcony) return false;
    return true;
  });

  return (
    <div className="flex flex-row h-screen relative">
      {/* Левая панель: фильтры или карточка */}
      <div className="w-80 bg-white p-4 shadow-lg overflow-y-auto h-full transition-all duration-300">
        {selectedHouse ? (
          <div>
            <button
              className="mb-4 text-blue-600 font-semibold"
              onClick={() => setSelectedHouse(null)}
            >
              ← Назад к фильтрам
            </button>
            {/* Галерея изображений */}
            {selectedHouse.images?.length > 0 && (
              <>
                <img
                  src={mediaUrl(selectedHouse.images[mainImgIdx])}
                  alt="Фото"
                  className="w-full h-40 object-cover rounded mb-2"
                />
                {selectedHouse.images.length > 1 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedHouse.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={mediaUrl(img)}
                        alt="Фото"
                        className={`w-16 h-12 object-cover rounded cursor-pointer border ${mainImgIdx === idx ? 'border-blue-500' : 'border-gray-200'}`}
                        onClick={() => setMainImgIdx(idx)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="font-bold text-lg mb-1">{selectedHouse.address}</div>
            <div className="text-green-600 font-semibold mb-1">{selectedHouse.price} ₸/мес</div>
            <div className="text-sm text-gray-700 mb-1">
              {selectedHouse.area ? <>Площадь: {selectedHouse.area} м²<br /></> : null}
              {selectedHouse.floor ? <>Этаж: {selectedHouse.floor}{selectedHouse.total_floors ? `/${selectedHouse.total_floors}` : ''}<br /></> : null}
              {selectedHouse.num_of_rooms ? <>Комнат: {selectedHouse.num_of_rooms}<br /></> : null}
              {selectedHouse.is_furnished ? <>✓ Меблировка<br /></> : null}
              {selectedHouse.has_balcony ? <>✓ Балкон<br /></> : null}
            </div>
            {selectedHouse.description && (
              <div className="text-xs text-gray-500 mb-2">
                {selectedHouse.description.substring(0, 100)}
                {selectedHouse.description.length > 100 ? '...' : ''}
              </div>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">🏠 {t("rentalCatalog.title")}</h1>
            {/* Фильтры */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Фильтры</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Цена */}
                <div>
                  <label className="block text-sm font-medium mb-1">Цена (₸)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                </div>

                {/* Тип недвижимости */}
                <div>
                  <label className="block text-sm font-medium mb-1">Тип</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="">Все типы</option>
                    <option value="apartment">Квартира</option>
                    <option value="house">Дом</option>
                    <option value="room">Комната</option>
                  </select>
                </div>

                {/* Количество комнат */}
                <div>
                  <label className="block text-sm font-medium mb-1">Комнаты</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="От"
                      min="1"
                      max="10"
                      value={filters.minRooms}
                      onChange={(e) => setFilters({...filters, minRooms: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="До"
                      min="1"
                      max="10"
                      value={filters.maxRooms}
                      onChange={(e) => setFilters({...filters, maxRooms: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                </div>

                {/* Дополнительные опции */}
                <div>
                  <label className="block text-sm font-medium mb-1">Опции</label>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.isFurnished}
                        onChange={(e) => setFilters({...filters, isFurnished: e.target.checked})}
                        className="mr-2"
                      />
                      Меблировка
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.hasBalcony}
                        onChange={(e) => setFilters({...filters, hasBalcony: e.target.checked})}
                        className="mr-2"
                      />
                      Балкон
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {/* Дата-пикер */}
            <RentalDatePicker
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              onSearch={fetchData}
              buttonText={t("rentalCatalog.find")}
            />
            <div className="mt-4 text-sm text-gray-600">
              Найдено: {filteredRentals.length} из {rentals.length} объектов
            </div>
          </>
        )}
      </div>
      {/* Карта */}
      <div className="flex-1 h-screen">
        {loading ? (
          <LoadingIndicator text={t("rentalCatalog.loading")} />
        ) : (
          <RentalMap rentals={filteredRentals} onRentClick={handleRent} onSelectHouse={setSelectedHouse} />
        )}
      </div>
    </div>
  );
}

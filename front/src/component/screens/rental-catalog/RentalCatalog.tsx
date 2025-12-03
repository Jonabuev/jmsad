import { useDateRange } from "@/component/hooks/catalog-rental/useDateRange";
import { useRentals } from "@/component/hooks/catalog-rental/useRentals";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getCookie } from "@/utils/cookieUtils";
import RentalDatePicker from "./rental-date/RentalDatePicker";
import LoadingIndicator from "./loading/LoadingIndicator";
import { useState, useEffect, useMemo, useCallback } from "react";
import { IHouse } from "@/component/type/properties.interface";
import { apiUrl, mediaUrl } from "@/utils/url";
import styles from "./RentalCatalog.module.scss";
import dynamic from "next/dynamic";

// ✅ Оптимизация: Yandex Map загружается динамически (уменьшает начальный бандл)
const RentalMap = dynamic(() => import("./rental-map/RentalMap"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Загрузка карты...</div>,
});

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
  // Мобильное меню
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Состояние загрузки при отправке запроса на аренду
  const [rentingHouseId, setRentingHouseId] = useState<number | null>(null);

  useEffect(() => {
    setMainImgIdx(0);
  }, [selectedHouse]);

  const handleRent = useCallback(async (houseId: number) => {
    if (!startDate || !endDate) {
      alert(t("rentalCatalog.selectDates"));
      return;
    }
    setRentingHouseId(houseId);
    try {
      await axios.post(
        apiUrl("/rent-house/"),
        {
          house_id: houseId,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${getCookie("access_token")}`,
          },
        }
      );
      alert(t("rentalCatalog.requestSent"));
    } catch (error) {
      alert(t("rentalCatalog.requestFailed"));
    } finally {
      setRentingHouseId(null);
    }
  }, [startDate, endDate, t]);

  // Применение фильтров к данным (мемоизировано для оптимизации)
  const filteredRentals = useMemo(() => {
    return rentals.filter((rental) => {
      if (filters.minPrice && parseFloat(rental.price) < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && parseFloat(rental.price) > parseFloat(filters.maxPrice)) return false;
      if (filters.propertyType && rental.type_p !== filters.propertyType) return false;
      if (filters.minRooms && rental.num_of_rooms < parseInt(filters.minRooms)) return false;
      if (filters.maxRooms && rental.num_of_rooms > parseInt(filters.maxRooms)) return false;
      if (filters.isFurnished && !rental.is_furnished) return false;
      if (filters.hasBalcony && !rental.has_balcony) return false;
      return true;
    });
  }, [rentals, filters]);

  return (
    <div className={styles.rentalCatalog}>
      {/* Мобильная кнопка для открытия sidebar */}
      <button 
        className={styles.mobileSidebarToggle}
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        🏠 Фильтры
      </button>

      {/* Мобильный backdrop */}
      <div 
        className={`${styles.mobileBackdrop} ${isMobileSidebarOpen ? styles.mobileOpen : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Левая панель: фильтры или карточка */}
      <div className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.mobileOpen : ''}`}>
        {selectedHouse ? (
          <div>
            <button
              className={styles.backButton}
              onClick={() => setSelectedHouse(null)}
            >
              ← {t("rentalCatalog.backToFilters")}
            </button>
            {/* Галерея изображений */}
            {selectedHouse.images?.length > 0 && (
              <div className={styles.imageGallery}>
                <img
                  src={mediaUrl(selectedHouse.images[mainImgIdx])}
                  alt={t("rentalCatalog.photo")}
                  className={styles.mainImage}
                />
                {selectedHouse.images.length > 1 && (
                  <div className={styles.thumbnailContainer}>
                    {selectedHouse.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={mediaUrl(img)}
                        alt={t("rentalCatalog.photo")}
                        className={`${styles.thumbnail} ${mainImgIdx === idx ? styles.active : ''}`}
                        onClick={() => setMainImgIdx(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={styles.houseDetails}>
              <div className={styles.houseAddress}>{selectedHouse.address}</div>
              <div className={styles.housePrice}>{selectedHouse.price} ₸/мес</div>
              <div className={styles.houseInfo}>
                {selectedHouse.area ? <>{t("rentalCatalog.area")}: {selectedHouse.area} м²<br /></> : null}
                {selectedHouse.floor ? <>{t("rentalCatalog.floor")}: {selectedHouse.floor}{selectedHouse.total_floors ? `/${selectedHouse.total_floors}` : ''}<br /></> : null}
                {selectedHouse.num_of_rooms ? <>{t("rentalCatalog.rooms")}: {selectedHouse.num_of_rooms}<br /></> : null}
                {selectedHouse.is_furnished ? <>✓ {t("rentalCatalog.furnished")}<br /></> : null}
                {selectedHouse.has_balcony ? <>✓ {t("rentalCatalog.balcony")}<br /></> : null}
              </div>
              {selectedHouse.description && (
                <div className={styles.houseDescription}>
                  {selectedHouse.description.substring(0, 100)}
                  {selectedHouse.description.length > 100 ? '...' : ''}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>🏠 {t("rentalCatalog.title")}</h1>
            {/* Фильтры */}
            <div className={styles.filtersSection}>
              <h3 className={styles.filtersTitle}>{t("rentalCatalog.filters")}</h3>
              <div className={styles.filtersGrid}>
                {/* Цена */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t("rentalCatalog.price")} (₸)</label>
                  <div className={styles.priceInputs}>
                    <input
                      type="number"
                      placeholder={t("rentalCatalog.from")}
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className={styles.filterInput}
                    />
                    <input
                      type="number"
                      placeholder={t("rentalCatalog.to")}
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className={styles.filterInput}
                    />
                  </div>
                </div>

                {/* Тип недвижимости */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t("rentalCatalog.type")}</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                    className={styles.filterSelect}
                  >
                    <option value="">{t("rentalCatalog.allTypes")}</option>
                    <option value="apartment">{t("rentalCatalog.apartment")}</option>
                    <option value="house">{t("rentalCatalog.house")}</option>
                    <option value="room">{t("rentalCatalog.room")}</option>
                  </select>
                </div>

                {/* Количество комнат */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t("rentalCatalog.rooms")}</label>
                  <div className={styles.roomsInputs}>
                    <input
                      type="number"
                      placeholder={t("rentalCatalog.from")}
                      min="1"
                      max="10"
                      value={filters.minRooms}
                      onChange={(e) => setFilters({...filters, minRooms: e.target.value})}
                      className={styles.filterInput}
                    />
                    <input
                      type="number"
                      placeholder={t("rentalCatalog.to")}
                      min="1"
                      max="10"
                      value={filters.maxRooms}
                      onChange={(e) => setFilters({...filters, maxRooms: e.target.value})}
                      className={styles.filterInput}
                    />
                  </div>
                </div>

                {/* Дополнительные опции */}
                <div className={styles.filterGroup}>
                  <label className={styles.optionsTitle}>{t("rentalCatalog.options")}</label>
                  <div className={styles.optionsList}>
                    <label className={styles.optionItem}>
                      <input
                        type="checkbox"
                        checked={filters.isFurnished}
                        onChange={(e) => setFilters({...filters, isFurnished: e.target.checked})}
                        className={styles.optionCheckbox}
                      />
                      {t("rentalCatalog.furnished")}
                    </label>
                    <label className={styles.optionItem}>
                      <input
                        type="checkbox"
                        checked={filters.hasBalcony}
                        onChange={(e) => setFilters({...filters, hasBalcony: e.target.checked})}
                        className={styles.optionCheckbox}
                      />
                      {t("rentalCatalog.balcony")}
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
            <div className={styles.resultsInfo}>
              {t("rentalCatalog.found")}: {filteredRentals.length} {t("rentalCatalog.of")} {rentals.length} {t("rentalCatalog.objects")}
            </div>
          </>
        )}
      </div>
      {/* Карта */}
      <div className={styles.mapContainer}>
        {loading ? (
          <LoadingIndicator text={t("rentalCatalog.loading")} />
        ) : (
          <RentalMap rentals={filteredRentals} onRentClick={handleRent} onSelectHouse={setSelectedHouse} rentingHouseId={rentingHouseId} />
        )}
      </div>
    </div>
  );
}

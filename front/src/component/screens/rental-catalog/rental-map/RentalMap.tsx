import { IHouse } from "@/component/type/properties.interface";
// import YandexMap from "@/component/map/YandexMap";
import dynamic from "next/dynamic";
import { mediaUrl } from "@/utils/url";
import styles from "./RentalMap.module.scss";

import { useEffect } from "react";
import { useTranslation } from "next-i18next";

const YandexMapWithNoSSR = dynamic(() => import("@/component/map/YandexMap"), {
  ssr: false,
  loading: () => <p>Загрузка карты...</p>,
});

declare global {
  interface Window {
    handleRent: (id: number) => void;
    handleSelectHouse: (id: number) => void;
  }
}

interface Props {
  rentals: IHouse[];
  onRentClick: (id: number) => void;
  onSelectHouse: (house: IHouse) => void;
  rentingHouseId?: number | null;
}

export default function RentalMap({ rentals, onRentClick, onSelectHouse, rentingHouseId }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    window.handleRent = onRentClick;
    window.handleSelectHouse = (id: number) => {
      const house = rentals.find((r) => r.id === id);
      if (house) onSelectHouse(house);
    };
  }, [onRentClick, onSelectHouse, rentals, rentingHouseId]);

  return (
    <div className={styles.mapContainer}>
      <YandexMapWithNoSSR
        center={[43.222, 76.8512]}
        zoom={11}
        markers={rentals.map((rental) => ({
          coordinates: [rental.latitude, rental.longitude] as [number, number],
          properties: {
            balloonContent: `
              <div style="padding: 10px; max-width: 300px;">
                <strong style="font-size: 16px; color: #1f2937;">${t(`form.${rental.type_p}`)}</strong><br/>
                <span style="color: #6b7280; font-size: 14px;">${rental.address}</span><br/>
                ${rental.price ? `<div style="margin: 8px 0; font-weight: bold; color: #059669;">${rental.price} ₸/мес</div>` : ''}
                ${rental.area ? `<div style="font-size: 12px; color: #6b7280;">Площадь: ${rental.area} м²</div>` : ''}
                ${rental.floor ? `<div style="font-size: 12px; color: #6b7280;">Этаж: ${rental.floor}${rental.total_floors ? `/${rental.total_floors}` : ''}</div>` : ''}
                ${rental.num_of_rooms ? `<div style="font-size: 12px; color: #6b7280;">Комнат: ${rental.num_of_rooms}</div>` : ''}
                ${rental.is_furnished ? `<div style="font-size: 12px; color: #059669;">✓ Меблировка</div>` : ''}
                ${rental.has_balcony ? `<div style="font-size: 12px; color: #059669;">✓ Балкон</div>` : ''}
                ${rental.description ? `<div style="margin: 8px 0; font-size: 12px; color: #374151;">${rental.description.substring(0, 100)}${rental.description.length > 100 ? '...' : ''}</div>` : ''}
                ${rental.images && rental.images.length > 0 ? `
                  <div style="margin: 8px 0;">
                    <img src="${mediaUrl(rental.images[0])}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;" alt="Фото апартамента" />
                    ${rental.images.length > 1 ? `<div style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 4px;">+${rental.images.length - 1} фото</div>` : ''}
                  </div>
                ` : ''}
                <button 
                  style="margin-top:8px; background:${rental.is_rented ? '#ef4444' : (rentingHouseId === rental.id ? '#9ca3af' : '#22c55e')}; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:${rentingHouseId === rental.id || rental.is_rented ? 'not-allowed' : 'pointer'}; font-weight:500; width:100%; opacity:${rentingHouseId === rental.id ? '0.7' : '1'};"
                  onclick="window.handleRent(${rental.id})"
                  ${rental.is_rented || rentingHouseId === rental.id ? 'disabled' : ''}
                >
                  ${rentingHouseId === rental.id ? (t("rentalCatalog.loading") || "Загрузка...") : (rental.is_rented ? t("rentalCatalog.rented") : t("rentalCatalog.rent"))}
                </button>
                <button
                  style="margin-top:8px; background:#2563eb; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500; width:100%;"
                  onclick="window.handleSelectHouse(${rental.id})"
                >
                  Подробнее
                </button>
              </div>
            `,
          },
          options: {
            iconColor: rental.is_rented ? '#ef4444' : '#22c55e',
          }
        }))}
      />
    </div>
  );
}

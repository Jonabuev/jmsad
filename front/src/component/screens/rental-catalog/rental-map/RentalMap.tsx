import { IHouse } from "@/component/type/properties.interface";
// import YandexMap from "@/component/map/YandexMap";
import dynamic from "next/dynamic";

import { useEffect } from "react";
import { useTranslation } from "next-i18next";

const YandexMapWithNoSSR = dynamic(() => import("@/component/map/YandexMap"), {
  ssr: false,
  loading: () => <p>Загрузка карты...</p>,
});

declare global {
  interface Window {
    handleRent: (id: number) => void;
  }
}

interface Props {
  rentals: IHouse[];
  onRentClick: (id: number) => void;
}

export default function RentalMap({ rentals, onRentClick }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    window.handleRent = onRentClick;
  }, [onRentClick]);

  return (
    <YandexMapWithNoSSR
      center={[43.222, 76.8512]}
      zoom={11}
      markers={rentals.map((rental) => ({
        coordinates: [rental.latitude, rental.longitude] as [number, number],
        properties: {
          balloonContent: `
            <strong>${t(`form.${rental.type_p}`)}</strong><br/>
            ${rental.address}<br/>
            <button 
              style="margin-top:8px; background:${rental.is_rented ? '#ef4444' : '#22c55e'}; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;"
              onclick="window.handleRent(${rental.id})"
              ${rental.is_rented ? 'disabled' : ''}
            >
              ${rental.is_rented ? t("rentalCatalog.rented") : t("rentalCatalog.rent")}
            </button>
          `,
        },
        options: {
          iconColor: rental.is_rented ? '#ef4444' : '#22c55e',
        }
      }))}
    />
  );
}

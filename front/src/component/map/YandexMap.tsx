"use client";
import React, { useEffect, useState, useCallback } from "react";
interface YMapOptions {
  center: [number, number];
  zoom: number;
  [key: string]: unknown;
}

interface PlacemarkProperties {
  hintContent?: string;
  balloonContent?: string;
  [key: string]: unknown;
}

interface PlacemarkOptions {
  iconLayout?: string;
  iconImageHref?: string;
  iconImageSize?: [number, number];
  [key: string]: unknown;
}

// Добавляем типизацию window.ymaps
export interface SuggestionItem {
  value: string;
  displayName?: string;
}

declare global {
  interface Window {
    ymaps: {
      suggest: (query: string) => Promise<SuggestionItem[]>;
      ready: (callback: () => void) => void;
      Map: new (element: HTMLElement, options: YMapOptions) => unknown;
      Placemark: new (
        coordinates: [number, number],
        properties?: PlacemarkProperties,
        options?: PlacemarkOptions
      ) => unknown;
    };
  }
}

export {};

const YANDEX_API_KEY = "718c3dc5-6c50-469a-886a-4ab165ea7876";

interface Marker {
  coordinates: [number, number];
  properties: {
    balloonContent: string;
  };
  options: {
    iconColor: string;
  };
}

interface YandexMapProps {
  center: [number, number];
  zoom: number;
  markers: Marker[];
}

const YandexMap: React.FC<YandexMapProps> = ({ center, zoom, markers }) => {
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(() => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      setError("Контейнер карты не найден");
      return;
    }

    try {
      mapContainer.innerHTML = "";

      const map = new window.ymaps.Map(mapContainer, {
        center: center,
        zoom: zoom,
        controls: ["zoomControl", "geolocationControl"],
      }) as {
        geoObjects: {
          add: (placemark: unknown) => void;
        };
      };

      markers.forEach((marker) => {
        const placemark = new window.ymaps.Placemark(
          marker.coordinates,
          { balloonContent: marker.properties.balloonContent },
          { preset: "islands#icon", iconColor: marker.options.iconColor }
        );
        map.geoObjects.add(placemark);
      });
    } catch (err) {
      setError("Ошибка инициализации карты");
      console.error("Ошибка инициализации карты:", err);
    }
  }, [center, zoom, markers]);

  useEffect(() => {
    if (window.ymaps) {
      window.ymaps.ready(initMap);
    } else {
      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
      script.async = true;
      script.onload = () => window.ymaps.ready(initMap);
      script.onerror = () => setError("Ошибка загрузки Яндекс.Карт");
      document.body.appendChild(script);
    }
  }, [initMap]);

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return <div id="map" style={{ width: "100%", height: "100%" }} />;
};

export default YandexMap;

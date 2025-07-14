"use client";


import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Script from "next/script";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/navigation";

interface PropertyFormInputs {
  address: string;
  type_p: string;
  num_of_rooms: number;
  price: number;
  description?: string;
  area?: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  is_furnished?: boolean;
  has_balcony?: boolean;
  comment?: string;
  images?: FileList;
}

const PropertyForm: FC = () => {
  const { t, i18n } = useTranslation();
  const { register, handleSubmit, setValue, watch } =
    useForm<PropertyFormInputs>();
  const router = useRouter();
  const addressValue = watch("address");

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadYMaps = () => {
      if (!window.ymaps) return;

      if (addressValue && addressValue.length > 2) {
        if (typingTimeout) clearTimeout(typingTimeout);

        const timeout = setTimeout(() => {
          window.ymaps
            .suggest(`${addressValue}, Алматы, Казахстан`)
            .then((res) => {
              if (Array.isArray(res)) {
                setSuggestions(res.map((item) => item.value));
              } else {
                console.error("Ожидался массив, но пришло:", res);
                setSuggestions([]);
              }
            })
            .catch((err: unknown) => {
              console.error("Ошибка при получении подсказок:", err);
              setSuggestions([]);
            });
        }, 300);

        setTypingTimeout(timeout);
      } else {
        setSuggestions([]);
      }
    };

    loadYMaps();
  }, [addressValue, typingTimeout]);

  const handleSuggestionClick = (suggestion: string) => {
    setValue("address", suggestion);
    setSuggestions([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
    }
  };

  const onSubmit = async (data: PropertyFormInputs) => {
    setErrorMessage(null); // Сброс ошибки при новом сабмите
    const token = localStorage.getItem("access_token");
    if (!token) {
      setErrorMessage("Вы не авторизованы");
      return;
    }

    try {
      // Создаем FormData для отправки файлов
      const formData = new FormData();
      
      // Добавляем все текстовые поля
      Object.keys(data).forEach(key => {
        if (key !== 'images' && data[key as keyof PropertyFormInputs] !== undefined) {
          formData.append(key, String(data[key as keyof PropertyFormInputs]));
        }
      });

      // Добавляем файлы
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file, index) => {
          formData.append('images', file);
        });
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/apartments/create/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Не устанавливаем Content-Type, браузер сам установит с boundary для FormData
          },
          body: formData,
        }
      );

      if (response.ok) {
        // const result = await response.json();
        // console.log("Недвижимость добавлена:", result);
        router.push(`/${i18n.language}/profile?success=1`);
      } else {
        let errorText = "Ошибка при добавлении недвижимости";
        try {
          const error = await response.json();
          if (error && error.detail) {
            errorText = error.detail;
          } else if (typeof error === 'string') {
            errorText = error;
          }
        } catch (e) {}
        setErrorMessage(errorText);
      }
    } catch (err: unknown) {
      setErrorMessage("Ошибка при запросе. Попробуйте позже.");
      console.error("Ошибка при запросе:", err);
    }
  };

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=718c3dc5-6c50-469a-886a-4ab165ea7876&suggest_apikey=b58e9c89-1936-4791-9b21-992744890054&lang=ru_RU"
        strategy="afterInteractive"
        onError={(e: ErrorEvent) => {
          console.error("Ошибка загрузки Yandex Maps API", e);
        }}
      />

      <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl text-center font-bold text-blue-500 mb-6">
          {t("form.title")}
        </h2>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Адрес */}
          <div className="relative">
            <label className="block font-medium">{t("form.address")}</label>
            <input
              type="text"
              {...register("address", { required: true })}
              className="w-full p-2 border rounded"
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Тип */}
          <div>
            <label className="block font-medium">
              {t("form.property_type")}
            </label>
            <select
              {...register("type_p", { required: true })}
              className="w-full p-2 border rounded"
            >
              <option value="">{t("form.select_type")}</option>
              <option value="apartment">{t("form.apartment")}</option>
              <option value="house">{t("form.house")}</option>
              <option value="room">{t("form.room")}</option>
            </select>
          </div>

          {/* Кол-во комнат */}
          <div>
            <label className="block font-medium">{t("form.rooms")}</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register("num_of_rooms", { required: true })}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Цена */}
          <div>
            <label className="block font-medium">Цена</label>
            <input
              type="number"
              min={0}
              step={0.01}
              {...register("price", { required: true })}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block font-medium">Описание</label>
            <textarea
              {...register("description")}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Площадь */}
          <div>
            <label className="block font-medium">Площадь (м²)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              {...register("area")}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Этаж */}
          <div>
            <label className="block font-medium">Этаж</label>
            <input
              type="number"
              min={0}
              {...register("floor")}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Этажность дома */}
          <div>
            <label className="block font-medium">Этажность дома</label>
            <input
              type="number"
              min={1}
              {...register("total_floors")}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Год постройки */}
          <div>
            <label className="block font-medium">Год постройки</label>
            <input
              type="number"
              min={1900}
              max={2100}
              {...register("year_built")}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Меблировка */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("is_furnished")}
              className="mr-2"
            />
            <label className="block font-medium">Меблировка</label>
          </div>

          {/* Балкон */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("has_balcony")}
              className="mr-2"
            />
            <label className="block font-medium">Балкон</label>
          </div>

          {/* Комментарий */}
          <div>
            <label className="block font-medium">Комментарий</label>
            <textarea
              {...register("comment")}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Загрузка изображений */}
          <div>
            <label className="block font-medium">Фотографии апартамента</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  Выбрано файлов: {selectedFiles.length}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold"
          >
            {t("form.submit")}
          </button>
        </form>
      </div>
    </>
  );
};

export default PropertyForm;

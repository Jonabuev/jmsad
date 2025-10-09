"use client";


import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Script from "next/script";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/navigation";
import { createProperty } from "@/api/propertyApi";
import styles from "./PropertyForm.module.scss";

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
    const token = getCookie("access_token");
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
      const response = await createProperty(formData, token);
      if (response.status === 200 || response.status === 201) {
        router.push(`/${i18n.language}/profile?success=1`);
      } else {
        let errorText = "Ошибка при добавлении недвижимости";
        try {
          const error = response.data;
          if (error && error.detail) {
            errorText = error.detail;
          } else if (typeof error === 'string') {
            errorText = error;
          }
        } catch (e) {}
        setErrorMessage(errorText);
      }
    } catch (err: any) {
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

      <div className={styles.propertyForm}>
        <h2 className={styles.formTitle}>
          {t("form.title")}
        </h2>
        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Адрес */}
          <div className={styles.addressField}>
            <label className={styles.formLabel}>{t("form.address")}</label>
            <input
              type="text"
              {...register("address", { required: true })}
              className={styles.formInput}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className={styles.addressSuggestions}>
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Тип */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("form.property_type")}
            </label>
            <select
              {...register("type_p", { required: true })}
              className={styles.formSelect}
            >
              <option value="">{t("form.select_type")}</option>
              <option value="apartment">{t("form.apartment")}</option>
              <option value="house">{t("form.house")}</option>
              <option value="room">{t("form.room")}</option>
            </select>
          </div>

          {/* Кол-во комнат */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("form.rooms")}</label>
            <input
              type="number"
              min={1}
              max={10}
              {...register("num_of_rooms", { required: true })}
              className={styles.formInput}
            />
          </div>

          {/* Цена */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Цена</label>
            <input
              type="number"
              min={0}
              step={0.01}
              {...register("price", { required: true })}
              className={styles.formInput}
            />
          </div>

          {/* Описание */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Описание</label>
            <textarea
              {...register("description")}
              className={styles.formTextarea}
            />
          </div>

          {/* Площадь */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Площадь (м²)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              {...register("area")}
              className={styles.formInput}
            />
          </div>

          {/* Этаж */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Этаж</label>
            <input
              type="number"
              min={0}
              {...register("floor")}
              className={styles.formInput}
            />
          </div>

          {/* Этажность дома */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Этажность дома</label>
            <input
              type="number"
              min={1}
              {...register("total_floors")}
              className={styles.formInput}
            />
          </div>

          {/* Год постройки */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Год постройки</label>
            <input
              type="number"
              min={1900}
              max={2100}
              {...register("year_built")}
              className={styles.formInput}
            />
          </div>

          {/* Меблировка */}
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              {...register("is_furnished")}
              className={styles.checkbox}
            />
            <label className={styles.checkboxLabel}>Меблировка</label>
          </div>

          {/* Балкон */}
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              {...register("has_balcony")}
              className={styles.checkbox}
            />
            <label className={styles.checkboxLabel}>Балкон</label>
          </div>

          {/* Комментарий */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Комментарий</label>
            <textarea
              {...register("comment")}
              className={styles.formTextarea}
            />
          </div>

          {/* Загрузка изображений */}
          <div className={styles.fileUploadGroup}>
            <label className={styles.formLabel}>Фотографии апартамента</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            {selectedFiles.length > 0 && (
              <div className={styles.filePreview}>
                <p className={styles.fileCount}>
                  Выбрано файлов: {selectedFiles.length}
                </p>
                <div className={styles.fileGrid}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
          >
            {t("form.submit")}
          </button>
        </form>
      </div>
    </>
  );
};

export default PropertyForm;

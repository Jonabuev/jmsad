"use client";

import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useApi } from "../hooks/useApi";
import { IProfileData } from "../type/users.interface";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchUserProfile } from "../store/auth/authSlice";
import FileUploadDropzone from "@/component/ui/FileUploadDropzone";
import styles from "./UserProfileForm.module.scss";



type FormValues = {
  username?: string;
  phone_number?: string;
  email?: string;
  document_type?: string;
  passport_expiry?: string;
  visa_num?: string;
  identifier:string;
};


const UserProfileForm = () => {
  const { profile: profileData, loading: profileLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { t } = useTranslation("common");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { fetchData: updateProfile, loading: updateLoading } = useApi<IProfileData>('/profile/edit/', {
    method: 'PATCH',
  }, { manual: true });

  useEffect(() => {
    if (profileData) {
      reset({
        username: profileData.username || "",
        phone_number: profileData.phone_number || "",
        email: profileData.email || "",
        identifier: profileData.identifier || "",
        document_type: profileData.document_type || "",
        passport_expiry: profileData.passport_expiry || "",
        visa_num: profileData.user?.visa_number || "",
      });
    }
  }, [profileData, reset]);
  const docType = watch("document_type");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setErrorMessage(null);
    const formPayload = new FormData();
    
    if (data.username?.trim()) formPayload.append("username", data.username);
    if(data.identifier?.trim()) formPayload.append("identifier", data.identifier);
    if (data.phone_number?.trim()) formPayload.append("phone_number", data.phone_number);
    if (data.email?.trim()) formPayload.append("email", data.email);

     if (data.document_type) formPayload.append("document_type", data.document_type);

    if (data.passport_expiry) formPayload.append("passport_expiry", data.passport_expiry);

    // Виза: если выбрано "visa", добавляем visa_num, иначе ставим null
    if (data.document_type === "visa") {
      if (data.visa_num?.trim()) formPayload.append("visa_num", data.visa_num);
    } else {
      formPayload.append("visa_num", "null"); // или просто не отправлять вообще
    }

    try {
      await updateProfile({ data: formPayload });
      dispatch(fetchUserProfile());
      router.push("/profile");
    } catch (err: any) {
      console.error("Ошибка при обновлении профиля:", err);
      
      // Формируем детальное сообщение об ошибке
      let errorText = "Ошибка при обновлении профиля";
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Приоритет: details > error > field_errors > старый формат
        if (errorData.details) {
          errorText = errorData.details;
        } else if (errorData.error) {
          errorText = errorData.error;
          // Если есть details, добавляем их
          if (errorData.details && errorData.details !== errorData.error) {
            errorText += `\n${errorData.details}`;
          }
        } else if (errorData.field_errors) {
          // Новый формат с field_errors
          const fieldErrors: string[] = [];
          Object.keys(errorData.field_errors).forEach((key) => {
            const fieldError = Array.isArray(errorData.field_errors[key]) 
              ? errorData.field_errors[key][0] 
              : errorData.field_errors[key];
            if (fieldError) {
              const fieldName = key === 'username' ? 'ФИО' : 
                               key === 'email' ? 'Email' : 
                               key === 'phone_number' ? 'Телефон' : 
                               key === 'identifier' ? 'ИИН' : 
                               key === 'document_type' ? 'Тип документа' :
                               key === 'passport_expiry' ? 'Срок действия документа' :
                               key === 'visa_num' ? 'Номер визы' : key;
              fieldErrors.push(`${fieldName}: ${fieldError}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorText = fieldErrors.join('\n');
          }
        } else if (typeof errorData === 'object') {
          // Старый формат - прямые ошибки полей
          const fieldErrors: string[] = [];
          Object.keys(errorData).forEach((key) => {
            const fieldError = Array.isArray(errorData[key]) 
              ? errorData[key][0] 
              : errorData[key];
            if (fieldError && typeof fieldError === 'string') {
              const fieldName = key === 'username' ? 'ФИО' : 
                               key === 'email' ? 'Email' : 
                               key === 'phone_number' ? 'Телефон' : 
                               key === 'identifier' ? 'ИИН' : 
                               key === 'document_type' ? 'Тип документа' :
                               key === 'passport_expiry' ? 'Срок действия документа' :
                               key === 'visa_num' ? 'Номер визы' : key;
              fieldErrors.push(`${fieldName}: ${fieldError}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorText = fieldErrors.join('\n');
          }
        } else if (typeof errorData === 'string') {
          errorText = errorData;
        }
      }
      
      setErrorMessage(errorText);
    }
  };


  if (profileLoading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>{t("editProfile.loading")}</p>
      </div>
    </div>
  );

  return (
    <div className={styles.userProfileForm}>
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            Редактирование профиля
          </h2>
          <p className={styles.formSubtitle}>
            Обновите информацию о себе
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {errorMessage && (
            <div className={styles.errorNotification}>
              <div className={styles.errorNotificationContent}>
                <svg className={styles.errorNotificationIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className={styles.errorNotificationText}>
                  <p className={styles.errorNotificationTitle}>Ошибка при обновлении профиля</p>
                  <pre className={styles.errorNotificationDetails}>{errorMessage}</pre>
                </div>
              </div>
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.fullName")}:
            </label>
            <input
              type="text"
              {...register("username")}
              className={styles.formInput}
              placeholder={t("editProfile.fullNameHint")}
            />
            <p className={styles.formHint}>{t("editProfile.fullNameHint")}</p>
            {errors.username && <p className={styles.formError}>{errors.username.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.iin")}:
            </label>
            <input
              type="text"
              {...register("identifier", {
                pattern: {
                  value: /^\d{12}$/,
                  message: "ИИН должен содержать ровно 12 цифр"
                }
              })}
              className={styles.formInput}
              placeholder="Введите 12-значный ИИН (необязательно)"
            />
            {errors.identifier && <p className={styles.formError}>{errors.identifier.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.phone")}:
            </label>
            <input
              type="text"
              {...register("phone_number")}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.email")}:
            </label>
            <input
              type="email"
              {...register("email", {
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Некорректный формат email"
                }
              })}
              className={styles.formInput}
            />
            {errors.email && <p className={styles.formError}>{errors.email.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.documentType")}:
            </label>
             <select
               {...register("document_type")}
               className={styles.formSelect}
             >
               <option value="">{t("editProfile.selectDocumentType")}</option>
               <option value="id_card">{t("editProfile.docType.id")}</option>
               <option value="passport_kz">{t("editProfile.docType.passport")}</option>
               <option value="visa">{t("editProfile.docType.visa")}</option>
             </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.passportExpiry")}:
            </label>
            <input
              type="date"
              {...register("passport_expiry", {
                validate: (value) => {
                  if (!value) return true; // поле не обязательно
                  const selected = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // убрать время
                  return selected >= today || t("editProfile.doc_expired");
                }
              })}
              className={styles.formInput}
            />
            {errors.passport_expiry && (
              <p className={styles.formError}>{errors.passport_expiry.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t("editProfile.visaNumber")}:
            </label>
            <input
              type="text"
              {...register("visa_num")}
              className={`${styles.formInput} ${docType !== "visa" ? styles.formInputDisabled : ""}`}
              disabled={docType !== "visa"}
              placeholder={docType !== "visa" ? t("editProfile.visaNumberHint") : ""}
            />
          </div>


          <button
            type="submit"
            className={styles.submitButton}
            disabled={updateLoading}
          >
            {updateLoading ? (
              <>
                <div className={styles.submitButtonSpinner}></div>
                {t("editProfile.saving")}
              </>
            ) : (
              t("editProfile.saveChanges")
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfileForm;

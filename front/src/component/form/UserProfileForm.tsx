"use client";

import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useApi } from "../hooks/useApi";
import { IProfileData } from "../type/users.interface";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchUserProfile } from "../store/auth/authSlice";



type FormValues = {
  username?: string;
  phone_number?: string;
  email?: string;
  avatar?: FileList | null;
  clearAvatar: boolean;
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
    const formPayload = new FormData();
    
    if (data.username?.trim()) formPayload.append("username", data.username);
    if(data.identifier?.trim()) formPayload.append("identifier", data.identifier);
    if (data.phone_number?.trim()) formPayload.append("phone_number", data.phone_number);
    if (data.email?.trim()) formPayload.append("email", data.email);
    formPayload.append("clear_avatar", String(data.clearAvatar));

    if (data.avatar && data.avatar.length > 0) {
      formPayload.append("avatar", data.avatar[0]);
    }

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
    } catch (err) {
      console.error("Ошибка при обновлении профиля:", err);
      alert("Ошибка при обновлении профиля");
    }
  };


  if (profileLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">{t("editProfile.loading")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Редактирование профиля
          </h2>
          <p className="text-gray-600 text-sm">
            Обновите информацию о себе
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("editProfile.fullName")}:
            </label>
            <input
              type="text"
              {...register("username")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
            />
            {errors.username && <p className="text-red-500 text-sm mt-2 font-medium">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
              placeholder="Введите 12-значный ИИН (необязательно)"
            />
            {errors.identifier && <p className="text-red-500 text-sm mt-2 font-medium">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("editProfile.phone")}:
            </label>
            <input
              type="text"
              {...register("phone_number")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
            />
            {errors.email && <p className="text-red-500 text-sm mt-2 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("editProfile.documentType")}:
            </label>
             <select
               {...register("document_type")}
               className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
             >
               <option value="">{t("editProfile.selectDocumentType")}</option>
               <option value="id_card">{t("editProfile.docType.id")}</option>
               <option value="passport_kz">{t("editProfile.docType.passport")}</option>
               <option value="visa">{t("editProfile.docType.visa")}</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
            />
            {errors.passport_expiry && (
              <p className="text-red-500 text-sm mt-2 font-medium">{errors.passport_expiry.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("editProfile.visaNumber")}:
            </label>
            <input
              type="text"
              {...register("visa_num")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={docType !== "visa"}
              placeholder={docType !== "visa" ? t("editProfile.visaNumberHint") : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("editProfile.uploadNew")}:
            </label>
            <input 
              type="file" 
              accept="image/*" 
              {...register("avatar")}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200 cursor-pointer"
            />
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <input 
              type="checkbox" 
              {...register("clearAvatar")} 
              className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700">{t("editProfile.clearAvatar")}</span>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            disabled={updateLoading}
          >
            {updateLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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

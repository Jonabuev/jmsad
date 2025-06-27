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
      });
    }
  }, [profileData, reset]);
  const docType = watch("document_type");
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const formPayload = new FormData();
    
    if (data.username?.trim()) formPayload.append("username", data.username);
    if (data.phone_number?.trim()) formPayload.append("phone_number", data.phone_number);
    if (data.email?.trim()) formPayload.append("email", data.email);
    formPayload.append("clear_avatar", String(data.clearAvatar));

    if (data.avatar && data.avatar.length > 0) {
      formPayload.append("avatar", data.avatar[0]);
    }

    if (data.document_type) formPayload.append("doc_type", data.document_type);

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


  if (profileLoading) return <p className="text-center">{t("editProfile.loading")}</p>;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md mx-auto bg-white p-6 rounded shadow"
    >
      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.fullName")}:
        </label>
        <input
          type="text"
          {...register("username")}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.iin")}:
        </label>
        <input
          type="text"
          value={profileData?.identifier || ''}
          readOnly
          className="w-full p-2 border border-gray-300 rounded bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.phone")}:
        </label>
        <input
          type="text"
          {...register("phone_number")}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
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
          className="w-full p-2 border border-gray-300 rounded"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.documentType")}:
        </label>
        <select
          {...register("document_type")}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">{t("editProfile.selectDocumentType")}</option>
          <option value="id">{t("editProfile.docType.id")}</option>
          <option value="passport">{t("editProfile.docType.passport")}</option>
          <option value="visa">{t("editProfile.docType.visa")}</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
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
          className="w-full p-2 border border-gray-300 rounded"
        />
        {errors.passport_expiry && (
          <p className="text-red-500 text-sm mt-1">{errors.passport_expiry.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.visaNumber")}:
        </label>
        <input
          type="text"
          {...register("visa_num")}
          className="w-full p-2 border border-gray-300 rounded"
          disabled={docType !== "visa"}
          placeholder={docType !== "visa" ? t("editProfile.visaNumberHint") : ""}
        />
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-1">
          {t("editProfile.uploadNew")}:
        </label>
        <input type="file" accept="image/*" {...register("avatar")} />
      </div>

      <div className="mb-6">
        <label className="flex items-center">
          <input type="checkbox" {...register("clearAvatar")} className="mr-2" />
          <span>{t("editProfile.clearAvatar")}</span>
        </label>
      </div>

      <button
        type="submit"
        className="bg-[#2094f3] text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        disabled={updateLoading}
      >
        {updateLoading ? t("editProfile.saving") : t("editProfile.saveChanges")}
      </button>
    </form>

  );
};

export default UserProfileForm;

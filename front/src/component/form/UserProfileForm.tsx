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
  username: string;
  phone_number: string;
  email: string;
  avatar: FileList | null;
  clearAvatar: boolean;
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

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const formPayload = new FormData();

    if (data.username.trim()) formPayload.append("username", data.username);
    if (data.phone_number.trim()) formPayload.append("phone_number", data.phone_number);
    if (data.email.trim()) formPayload.append("email", data.email);
    formPayload.append("clear_avatar", String(data.clearAvatar));
    if (data.avatar && data.avatar.length > 0) {
      formPayload.append("avatar", data.avatar[0]);
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
          {...register("username", { required: "Имя пользователя обязательно" })}
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
            required: "Email обязателен",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Некорректный формат email"
            }
          })}
          className="w-full p-2 border border-gray-300 rounded"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
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

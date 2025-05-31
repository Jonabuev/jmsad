"use client";

import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

const UserProfileForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    identifier: "",
    phone_number: "",
    email: "",
    avatar: "",
    newAvatar: null as File | null,
    clearAvatar: false,
  });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation("common");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData((prev) => ({
        ...prev,
        newAvatar: e.target.files?.[0] || null,
      }));
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Вы не авторизованы");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/profile/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          username: data.full_name || "",
          identifier: data.identifier || "",
          phone_number: data.phone || "",
          email: data.email || "",
          avatar: data.avatar || "",
        }));
      } else {
        console.error("Ошибка загрузки профиля");
      }
    } catch (err) {
      console.error("Ошибка при получении профиля:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Вы не авторизованы");
      return;
    }

    const form = new FormData();

    // Добавляем только если есть значение
    if (formData.username.trim()) {
      form.append("username", formData.username);
    }

    if (formData.phone_number.trim()) {
      form.append("phone_number", formData.phone_number);
    }

    if (formData.email.trim()) {
      form.append("email", formData.email);
    }

    // Обработка флага очистки аватара
    form.append("clear_avatar", String(formData.clearAvatar));

    // Добавляем аватар, если выбран новый файл
    if (formData.newAvatar) {
      form.append("avatar", formData.newAvatar);
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/profile/edit/", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Профиль обновлён:", data);

        fetchProfile(); // Обновить отображение
        router.push("/profile"); // Заменить на нужный путь
      } else {
        const errorData = await response.json();
        console.error("Ошибка:", errorData);
        alert("Ошибка при обновлении профиля");
      }
    } catch (err) {
      console.error("Ошибка при запросе:", err);
    }
  };

  if (loading) return <p className="text-center">{t("editProfile.loading")}</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto bg-white p-6 rounded shadow"
    >
      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.fullName")}:
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.iin")}:
        </label>
        <input
          type="text"
          name="identifier"
          value={formData.identifier}
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
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          {t("editProfile.email")}:
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-1">
          {t("editProfile.uploadNew")}:
        </label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <button
        type="submit"
        className="bg-[#2094f3] text-white px-6 py-2 rounded hover:bg-blue-600 transition"
      >
        {t("editProfile.saveChanges")}
      </button>
    </form>
  );
};

export default UserProfileForm;

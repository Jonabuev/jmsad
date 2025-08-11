import { FC, useState, useEffect } from "react";
import { register } from "@/api/authApi";
import { saveTokens } from "@/utils/tokenUtils";
import { IRegisterData } from "../type/users.interface";
import { useTranslation } from "next-i18next";
import { COUNTRY_OPTIONS } from "../constants/countries";
import Link from "next/link";
import GoogleLoginButton from "../common/GoogleLoginButton";

interface IRegisterErrors {
  username?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  type_entity?: string;
  type_identify?: string;
  identifier?: string;
  document_type?: string;
  passport_expiry?: string;
  visa_number?: string;
  password1?: string;
  password2?: string;
  [key: string]: string | undefined;
}

const RegisterForm: FC = () => {
  const [formData, setFormData] = useState<IRegisterData>({
    username: "",
    email: "",
    phone_number: "",
    role: "tenant", // или "landlord"
    type_entity: "individual", 
    type_identify: "iin",
    identifier: "",
    document_type: "id_card",
    passport_expiry: "",
    visa_number: "",
    password1: "",
    citizenship: "KZ", // По умолчанию Казахстан
    password2: "",
  });

  const [errors, setErrors] = useState<IRegisterErrors>({});
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "type_entity") {
      const newTypeIdentify = value === "legal_entity" ? "bin" : "iin";
      const newDocumentType = value === "individual" ? "id_card" : "id_card";
      setFormData({
        ...formData,
        type_entity: value as "individual" | "legal_entity",
        type_identify: newTypeIdentify as "iin" | "bin",
        document_type: newDocumentType as "id_card" | "passport_kz" | "visa",
        visa_number: "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: IRegisterErrors = {};

    if (!formData.username)
      validationErrors.username = t("registration.field_required");
    if (!formData.email)
      validationErrors.email = t("registration.field_required");
    if (!formData.password1)
      validationErrors.password1 = t("registration.field_required");
    if (formData.password1 !== formData.password2)
      validationErrors.password2 = t("registration.password_mismatch");
    if (!formData.role)
      validationErrors.role = t("registration.field_required");
    if (
      !(formData.document_type === "visa" && formData.type_entity === "individual") &&
      !formData.identifier
    ) {
      validationErrors.identifier = t("registration.field_required");
    }
    if (!formData.citizenship)
      validationErrors.citizenship = t("registration.field_required");
    if (
      ["id_card", "passport_kz", "visa"].includes(formData.document_type)
    ) {
      if (!formData.passport_expiry) {
        validationErrors.passport_expiry = t("registration.field_required");
      } else if (new Date(formData.passport_expiry) < new Date()) {
        validationErrors.passport_expiry = t("registration.doc_expired");
      }
    }

    if (
      formData.document_type === "visa" &&
      !formData.visa_number &&
      formData.type_entity === "individual"
    ) {
      validationErrors.visa_number = t("registration.field_required");
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const response = await register(formData);
      if (response.status === 200 || response.status === 201) {
        saveTokens(response.data.access_token, response.data.refresh_token);
        window.location.href = response.data.profile_url;
        alert(t("registration.successful_registration"));
      }
    } catch (error: any) {
      if (error.response?.data) {
        const djangoErrors = error.response.data;
        const newErrors: IRegisterErrors = {};
        for (const key in djangoErrors) {
          if (Array.isArray(djangoErrors[key])) {
            newErrors[key] = djangoErrors[key][0];
          } else {
            newErrors[key] = djangoErrors[key];
          }
        }
        setErrors(newErrors);
      } else {
        console.error("Ошибка при отправке данных:", error);
      }
    }
  };

  // Фильтруем страны, исключая разделитель
  const validCountries = COUNTRY_OPTIONS.filter(country => country.code !== "");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t("registration.registration1")}
          </h1>
          <p className="text-gray-600">
            {t("registration.already_have_account")}{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t("navigation.login")}
            </Link>
          </p>
        </div>

        {/* Google кнопка */}
        {isClient && (
          <div className="mb-6">
            <GoogleLoginButton 
              onSuccess={() => {
                console.log("Google login successful from registration form");
              }}
              onError={(error) => {
                console.error("Google login error:", error);
              }}
              className="w-full"
            />
          </div>
        )}

        {/* Разделитель */}
        {isClient && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t("registration.or")}</span>
            </div>
          </div>
        )}

        {/* Кнопки выбора типа пользователя */}
        {isClient && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "tenant" })}
              className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                formData.role === "tenant"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("registration.tenant")}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "landlord" })}
              className={`px-4 py-3 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                formData.role === "landlord"
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("registration.landlord")}
            </button>
          </div>
        )}

        {isClient && (
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Тип пользователя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.user_type")}
            </label>
            <select
              name="type_entity"
              value={formData.type_entity}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="individual">{t("registration.individual")}</option>
              <option value="legal_entity">{t("registration.legal_entity")}</option>
            </select>
          </div>

          {/* ФИО */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.full_name")}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("registration.full_name_placeholder")}
            />
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          {/* ИИН/БИН */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.type_entity === "individual" ? t("registration.iin") : t("registration.bin")}
            </label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={formData.type_entity === "individual" ? t("registration.iin_placeholder") : t("registration.bin_placeholder")}
            />
            {errors.identifier && <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>}
          </div>

          {/* Гражданство */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.citizenship")}
            </label>
            <select
              name="citizenship"
              value={formData.citizenship}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {validCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.citizenship && <p className="text-red-500 text-sm mt-1">{errors.citizenship}</p>}
          </div>

          {/* Тип документа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.document_type")}
            </label>
            <select
              name="document_type"
              value={formData.document_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="id_card">{t("registration.id_card")}</option>
              <option value="passport_kz">{t("registration.passport_kz")}</option>
              <option value="visa">{t("registration.visa")}</option>
            </select>
          </div>

          {/* Дата окончания срока документа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.document_expiry")}
            </label>
            <input
              type="date"
              name="passport_expiry"
              value={formData.passport_expiry}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.passport_expiry && <p className="text-red-500 text-sm mt-1">{errors.passport_expiry}</p>}
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.phone")}
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (___) ___-__-__"
            />
            {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.email")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.password")}
            </label>
            <input
              type="password"
              name="password1"
              value={formData.password1}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            {errors.password1 && <p className="text-red-500 text-sm mt-1">{errors.password1}</p>}
          </div>

          {/* Подтверждение пароля */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.confirm_password")}
            </label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            {errors.password2 && <p className="text-red-500 text-sm mt-1">{errors.password2}</p>}
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 mt-6"
          >
            {t("registration.done")}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;

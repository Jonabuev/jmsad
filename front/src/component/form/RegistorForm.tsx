import { FC, useState } from "react";
import { register } from "@/api/authApi";
import { IRegisterData } from "../type/users.interface";
import { useTranslation } from "react-i18next";
import { COUNTRY_OPTIONS } from "../constants/countries";

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
    citizenship: "",
    password2: "",
  });

  const [errors, setErrors] = useState<IRegisterErrors>({});
  const { t } = useTranslation("common");

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
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
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

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-xl font-bold mb-4 text-center text-blue-500">
        {t("registration.registration1")}
      </h2>

      {/* Тип пользователя */}
      <div className="mb-4">
        <label className="block text-gray-700">
          {t("registration.user_type")}:
        </label>
        <select
          name="type_entity"
          value={formData.type_entity}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        >
          <option value="individual">{t("registration.individual")}</option>
          <option value="legal_entity">{t("registration.legal_entity")}</option>
        </select>
      </div>

      {/* Роль */}
      <div className="mb-4">
        <label className="block text-gray-700">
          {t("registration.role")}:
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        >
          
          <option value="tenant">{t("registration.tenant")}</option>
          <option value="landlord">{t("registration.landlord")}</option>
        </select>
        {errors.role && <p className="text-red-500">{errors.role}</p>}
      </div>

      {/* ФИО */}
      <div>
        <label className="block text-gray-700">{t("registration.full_name")}</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        {errors.username && <p className="text-red-500">{errors.username}</p>}
      </div>
      <div>
        <label className="block text-gray-700">{t("registration.citizenship")}</label>
        <select
          name="citizenship"
          value={formData.citizenship}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        >
          <option value=""></option>
          {COUNTRY_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        {errors.citizenship && (
          <p className="text-red-500">{errors.citizenship}</p>
        )}
      </div>

      {/* ИИН/БИН */}
      <div>
        <label className="block text-gray-700">
          {formData.type_entity === "individual"
            ? t("registration.iin")
            : t("registration.bin")}
        </label>
        <input
          type="text"
          name="identifier"
          value={formData.identifier}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        {errors.identifier && <p className="text-red-500">{errors.identifier}</p>}
      </div>

      {/* Тип документа */}
      <div className="mb-4">
        <label className="block text-gray-700">
          {t("registration.document_type")}:
        </label>
        <select
          name="document_type"
          value={formData.document_type}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        >
          <option value="id_card">{t("registration.id_card")}</option>
          <option value="passport_kz">{t("registration.passport_kz")}</option>
          {formData.type_entity === "individual" && (
            <option value="visa">{t("registration.visa")}</option>
          )}
        </select>
      </div>

      {/* Номер визы */}
      {formData.document_type === "visa" && formData.type_entity === "individual" && (
        <div>
          <label className="block text-gray-700">
            {t("registration.visa_number")}
          </label>
          <input
            type="text"
            name="visa_number"
            value={formData.visa_number}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
          {errors.visa_number && (
            <p className="text-red-500">{errors.visa_number}</p>
          )}
        </div>
      )}

      {/* Срок действия */}
      {(formData.document_type === "id_card" ||
        formData.document_type === "passport_kz" ||
        formData.document_type === "visa") && (
        <div>
          <label className="block text-gray-700">
            {t("registration.passport_expiry")}
          </label>
          <input
            type="date"
            name="passport_expiry"
            value={formData.passport_expiry}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
          {errors.passport_expiry && (
            <p className="text-red-500">{errors.passport_expiry}</p>
          )}
        </div>
      )}

      {/* Телефон */}
      <div>
        <label className="block text-gray-700">{t("registration.phone")}</label>
        <input
          type="tel"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        {errors.phone_number && (
          <p className="text-red-500">{errors.phone_number}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-700">{t("registration.email")}</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}
      </div>

      {/* Пароль */}
      <div>
        <label className="block text-gray-700">{t("registration.password")}</label>
        <input
          type="password"
          name="password1"
          value={formData.password1}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        {errors.password1 && (
          <p className="text-red-500">{errors.password1}</p>
        )}
      </div>

      {/* Подтверждение пароля */}
      <div>
        <label className="block text-gray-700">
          {t("registration.confirm_password")}
        </label>
        <input
          type="password"
          name="password2"
          value={formData.password2}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        {errors.password2 && (
          <p className="text-red-500">{errors.password2}</p>
        )}
      </div>

      {/* Кнопка */}
      <button
        type="submit"
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white p-2 rounded mt-4"
      >
        {t("registration.submit")}
      </button>
    </div>
  );
};

export default RegisterForm;

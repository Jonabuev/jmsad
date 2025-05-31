import { FC, useState } from "react";
import axios from "axios";
import { IRegisterData } from "../type/users.interface";
import { useTranslation } from "react-i18next"; // Подключаем useTranslation для использования переводов

interface IRegisterErrors {
  username?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  type_entity?: string;
  identifier?: string;
  password1?: string;
  password2?: string;
  documents?: string;
  [key: string]: string | undefined;
}

const RegisterForm: FC = () => {
  const [formData, setFormData] = useState<IRegisterData>({
    username: "",
    email: "",
    phone_number: "",
    role: "",
    type_entity: "individual",
    type_identify: "iin",
    identifier: "",
    password1: "",
    password2: "",
  });

  const [errors, setErrors] = useState<IRegisterErrors>({});
  const { t } = useTranslation("common");
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/register/",
        formData
      );

      if (response.status === 200 || response.status === 201) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        window.location.href = response.data.profile_url;
        alert(t("registration.successful_registration"));
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data) {
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

      {/* Выбор типа пользователя */}
      <div className="mb-4">
        <label className="block text-gray-700">
          {t("registration.user-type")}:
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
        {errors.type_entity && (
          <p className="text-red-500">{errors.type_entity}</p>
        )}
      </div>

      {/* Выбор роли */}
      {formData.type_entity && (
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
            <option value="">{t("registration.role")}</option>
            <option value="tenant">{t("registration.tenant")}</option>
            <option value="landlord">{t("registration.landlord")}</option>
          </select>
          {errors.role && <p className="text-red-500">{errors.role}</p>}
        </div>
      )}

      {/* Форма регистрации */}
      {formData.type_entity && formData.role && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">
              {t("registration.full_name")}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
            {errors.username && (
              <p className="text-red-500">{errors.username}</p>
            )}
          </div>

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
            {errors.identifier && (
              <p className="text-red-500">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700">
              {t("registration.phone")}
            </label>
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

          <div>
            <label className="block text-gray-700">
              {t("registration.email")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
            {errors.email && <p className="text-red-500">{errors.email}</p>}
          </div>

          {formData.type_entity === "legal_entity" && (
            <div>
              <label className="block text-gray-700">
                {t("registration.documents")}
              </label>
              <input
                type="text"
                name="documents"
                value={formData.documents}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700">
              {t("registration.password")}
            </label>
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

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            {t("registration.submit")}
          </button>
        </form>
      )}
    </div>
  );
};

export default RegisterForm;

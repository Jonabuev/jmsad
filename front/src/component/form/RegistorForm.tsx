import { FC, useState, useEffect } from "react";
import { register } from "@/api/authApi";
import { saveTokens } from "@/utils/tokenUtils";
import { IRegisterData } from "../type/users.interface";
import { useTranslation } from "next-i18next";
import { COUNTRY_OPTIONS } from "../constants/countries";
import Link from "next/link";
import GoogleLoginButton from "../common/GoogleLoginButton";
import { useDispatch } from "react-redux";
import { fetchUserProfile } from "@/component/store/auth/authSlice";
import { useRouter } from "next/router";
import { AppDispatch } from "@/component/store/store";
import styles from "./RegistorForm.module.scss";

interface IRegisterErrors {
  username?: string;
  email?: string;
  phone_number?: string;
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

const buildRegisterFormData = (data: IRegisterData) => {
  const fd = new FormData();
  (Object.entries(data) as [keyof IRegisterData, IRegisterData[keyof IRegisterData]][]).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== null) {
        fd.append(key, typeof value === "string" ? value : String(value));
      }
    }
  );
  return fd;
};

const RegisterForm: FC = () => {
  const [formData, setFormData] = useState<IRegisterData>({
    username: "",
    email: "",
    phone_number: "",
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
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation("common");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

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

    setIsLoading(true);
    try {
      console.log("📝 Начинаем процесс регистрации...");
      const registerPayload = buildRegisterFormData(formData);
      const response = await register(registerPayload);
      if (response.status === 200 || response.status === 201) {
        console.log("✅ Регистрация успешна, сохраняем токены...");
        saveTokens(response.data.access_token, response.data.refresh_token);
        
        console.log("🔄 Обновляем Redux store...");
        await dispatch(fetchUserProfile());
        
        console.log("🚀 Перенаправляем на профиль...");
        router.push("/profile");
        
        alert(t("registration.successful_registration"));
      }
    } catch (error: any) {
      console.error("❌ Ошибка при регистрации:", error);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтруем страны, исключая разделитель
  const validCountries = COUNTRY_OPTIONS.filter(country => country.code !== "");

  return (
    <div className={styles.registerForm}>
      <div className={styles.container}>
        {/* Заголовок */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {t("registration.registration1")}
          </h1>
          <p className={styles.subtitle}>
            {t("registration.already_have_account")}{" "}
            <Link href="/login" className={styles.loginLink}>
              {t("navigation.login")}
            </Link>
          </p>
        </div>

        {/* Google кнопка */}
        {isClient && (
          <div className={styles.googleButtonContainer}>
            <GoogleLoginButton 
              onSuccess={async () => {
                console.log("✅ Google login successful from registration form");
                console.log("🔄 Обновляем Redux store...");
                try {
                  await dispatch(fetchUserProfile());
                  console.log("🚀 Перенаправляем на профиль...");
                  router.push("/profile");
                } catch (error) {
                  console.error("❌ Ошибка при обновлении Redux store:", error);
                  // Fallback на window.location
                  window.location.href = "/profile";
                }
              }}
              onError={(error) => {
                console.error("Google login error:", error);
              }}
              className={styles.googleButton}
            />
          </div>
        )}

        {/* Разделитель */}
        {isClient && (
          <div className={styles.divider}>
            <div className={styles.dividerLine}></div>
            <div className={styles.dividerText}>
              <span>{t("registration.or")}</span>
            </div>
          </div>
        )}


        {isClient && (
          <form onSubmit={handleSubmit} className={styles.form}>
          {/* Тип пользователя */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.user_type")}
            </label>
            <select
              name="type_entity"
              value={formData.type_entity}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="individual">{t("registration.individual")}</option>
              <option value="legal_entity">{t("registration.legal_entity")}</option>
            </select>
          </div>

          {/* ФИО */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.full_name")}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
              placeholder={t("registration.full_name_placeholder")}
            />
            <p className={styles.hint}>{t("registration.full_name_hint")}</p>
            {errors.username && <p className={styles.errorMessage}>{errors.username}</p>}
          </div>

          {/* ИИН/БИН */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {formData.type_entity === "individual" ? t("registration.iin") : t("registration.bin")}
            </label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.identifier ? styles.inputError : ''}`}
              placeholder={formData.type_entity === "individual" ? t("registration.iin_placeholder") : t("registration.bin_placeholder")}
            />
            {errors.identifier && <p className={styles.errorMessage}>{errors.identifier}</p>}
          </div>

          {/* Гражданство */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.citizenship")}
            </label>
            <select
              name="citizenship"
              value={formData.citizenship}
              onChange={handleInputChange}
              className={`${styles.select} ${errors.citizenship ? styles.inputError : ''}`}
            >
              {validCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.citizenship && <p className={styles.errorMessage}>{errors.citizenship}</p>}
          </div>

          {/* Тип документа */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.document_type")}
            </label>
            <select
              name="document_type"
              value={formData.document_type}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="id_card">{t("registration.id_card")}</option>
              <option value="passport_kz">{t("registration.passport_kz")}</option>
              <option value="visa">{t("registration.visa")}</option>
            </select>
          </div>

          {/* Дата окончания срока документа */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.document_expiry")}
            </label>
            <input
              type="date"
              name="passport_expiry"
              value={formData.passport_expiry}
              onChange={handleInputChange}
              className={`${styles.input} ${styles.dateInput} ${errors.passport_expiry ? styles.inputError : ''}`}
            />
            {errors.passport_expiry && <p className={styles.errorMessage}>{errors.passport_expiry}</p>}
          </div>

          {/* Телефон */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.phone")}
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={`${styles.input} ${styles.phoneInput} ${errors.phone_number ? styles.inputError : ''}`}
              placeholder="+7 (___) ___-__-__"
            />
            {errors.phone_number && <p className={styles.errorMessage}>{errors.phone_number}</p>}
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.email")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="example@email.com"
            />
            {errors.email && <p className={styles.errorMessage}>{errors.email}</p>}
          </div>

          {/* Пароль */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.password")}
            </label>
            <input
              type="password"
              name="password1"
              value={formData.password1}
              onChange={handleInputChange}
              className={`${styles.input} ${styles.passwordInput} ${errors.password1 ? styles.inputError : ''}`}
              placeholder="••••••••"
            />
            {errors.password1 && <p className={styles.errorMessage}>{errors.password1}</p>}
          </div>

          {/* Подтверждение пароля */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t("registration.confirm_password")}
            </label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleInputChange}
              className={`${styles.input} ${styles.passwordInput} ${errors.password2 ? styles.inputError : ''}`}
              placeholder="••••••••"
            />
            {errors.password2 && <p className={styles.errorMessage}>{errors.password2}</p>}
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className={styles.submitButtonSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("registration.loading") || "Загрузка..."}
              </>
            ) : (
              t("registration.done")
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;

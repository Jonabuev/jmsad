import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Авторизация
      const loginResponse = await axios.post(
        "http://127.0.0.1:8000/api/login/",
        {
          username: formData.username,
          password: formData.password,
        }
      );

      const token = loginResponse.data.access_token;
      localStorage.setItem("access_token", token);

      // 2. Получаем профиль пользователя
      const profileResponse = await axios.get(
        "http://127.0.0.1:8000/api/profile/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profileData = profileResponse.data;
      localStorage.setItem("profile", JSON.stringify(profileData));

      // 3. Переход на страницу профиля
      router.push("/profile");
    } catch (err) {
      const axiosError = err as AxiosError;
      setError("Неверное имя пользователя или пароль.");
      console.error(
        "Login error:",
        axiosError.response ? axiosError.response.data : axiosError
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-6">Войти</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-4">
            <label htmlFor="username" className="block font-bold mb-1">
              Имя пользователя
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Введите имя пользователя"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block font-bold mb-1">
              Пароль
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Введите пароль"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md font-semibold"
          >
            Войти
          </button>
        </form>
        <p className="mt-4 text-sm">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            Зарегистрироваться
          </Link>
        </p>
        <p className="mt-4 text-sm">
          Другой способ входа:{" "}
          <Link href="/google" className="text-blue-500 hover:underline">
            Gmail
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

import api from "@/service/api";

export const googleAuth = (token: string) =>
  api.post("/auth/google/", { token });

export const login = (email: string, password: string) =>
  api.post("/login/", { email, password });  // ✅ Изменено поле на email

export const fetchProfileWithToken = (token: string) =>
  api.get("/profile/", { headers: { Authorization: `Bearer ${token}` } });

export const register = (formData: FormData) =>
  api.post("/register/", formData); 
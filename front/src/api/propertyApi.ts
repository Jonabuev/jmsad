import api from "@/service/api";

export const createProperty = (formData: FormData, token: string) =>
  api.post("/apartments/create/", formData, {
    headers: { Authorization: `Bearer ${token}` },
  }); 
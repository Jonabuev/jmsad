import api from "@/service/api";

// Получить причины жалоб с поддержкой мультиязычности
export const fetchComplaintReasons = (locale: string = 'ru', type?: string) => {
  const params = new URLSearchParams({ locale });
  if (type) params.append('type', type);
  
  return api.get(`/all-complaint-reasons/?${params.toString()}`);
};

export const fetchTenants = (params: Record<string, string>, token: string) =>
  api.get("/tenant-registry1/", { params, headers: { Authorization: `Bearer ${token}` } });

export const fetchLandlords = (params: Record<string, string>, token: string) =>
  api.get("/landlords/", { params, headers: { Authorization: `Bearer ${token}` } }); 
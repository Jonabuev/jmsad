import api from "@/service/api";

// Получить список жалоб
export const fetchComplaints = () => api.get("/complaints/");

// Добавить жалобу
export const addComplaint = (data: any) => api.post("/complaints/", data);

// Получить жалобу по id
export const fetchComplaintById = (id: string | number) => api.get(`/complaints/${id}/`);

// Обновить статус жалобы
export const updateComplaintStatus = (
  complaintId: number,
  status: "reviewed" | "rejected"
) => api.post(`/complaints1/${complaintId}/status/`, { status });

// Получить аренды пользователя
export const fetchMyRentals = (token: string) =>
  api.get("/my-rentals/", { headers: { Authorization: `Bearer ${token}` } });

// Получить причины жалоб
export const fetchComplaintReasons = (token: string) =>
  api.get("/complaint-reasons/", { headers: { Authorization: `Bearer ${token}` } });

// Создать жалобу (submit complaint)
export const submitRentalComplaint = (data: FormData, token: string) =>
  api.post("/rental-complaints/create/", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Получить жалобу по uuid
export const fetchRentalComplaintByUuid = (uuid: string, token: string) =>
  api.get(`/rental-complaints/${uuid}/`, { headers: { Authorization: `Bearer ${token}` } });

// Обновить жалобу (patch)
export const updateRentalComplaint = (uuid: string, data: FormData, token: string) =>
  api.patch(`/rental-complaints/${uuid}/update/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Отправить оспаривание жалобы (dispute) с файлом
export const disputeRentalComplaint = (uuid: string, formData: FormData, token: string) =>
  api.post(`/complaints/${uuid}/dispute/`, formData, {
    headers: { Authorization: `Bearer ${token}` },
  }); 
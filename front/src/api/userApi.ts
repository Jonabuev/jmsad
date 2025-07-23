import api from "@/service/api";

export const fetchUserProfile = () => api.get("/profile/");

// Снять блокировку с пользователя
export const removeBan = (user_id: number) =>
  api.post("/remove-ban/", { user_id });

// Назначить нарушение пользователю
export const issueViolation = (user_id: number, reason: string) =>
  api.post("/issue-violation/", { user_id, reason });

// Верификация личности пользователя (загрузка документа)
export const verifyIdentity = (formData: FormData, token: string) =>
  api.post("/verify-identity1/", formData, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Оспаривание жалобы
export const disputeComplaint = (complaintId: number, newDescription: string, token: string) =>
  api.post(
    `/complaints/${complaintId}/dispute/`,
    { new_description: newDescription },
    { headers: { Authorization: `Bearer ${token}` } }
  );

// Обновление access_token по refresh_token
export const refreshAccessToken = (refreshToken: string) =>
  api.post("/token/refresh/", { refresh: refreshToken }); 
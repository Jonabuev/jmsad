import api from "@/service/api";

export const requestPasswordChange = (token: string) =>
  api.post(
    "/request-password-change/",
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const confirmPasswordChange = (
  code: string,
  newPassword: string,
  token: string
) =>
  api.post(
    "/confirm-password-change/",
    { code, new_password: newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const changePassword = (code: string, newPassword: string) =>
  api.post("/change-password/", { code, new_password: newPassword });

export const requestPasswordReset = (email: string) =>
  api.post("/request-password-reset/", { email });

export const confirmPasswordReset = (email: string, code: string, newPassword: string) =>
  api.post("/confirm-password-change/", { email, code, new_password: newPassword }); 
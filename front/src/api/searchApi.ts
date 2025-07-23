import api from "@/service/api";

export const fetchComplaintReasons = () =>
  api.get("/all-complaint-reasons/");

export const fetchTenants = (params: Record<string, string>, token: string) =>
  api.get("/tenant-registry1/", { params, headers: { Authorization: `Bearer ${token}` } });

export const fetchLandlords = (params: Record<string, string>, token: string) =>
  api.get("/landlords/", { params, headers: { Authorization: `Bearer ${token}` } }); 
import api from "@/service/api";

export const fetchRentalRequests = (token: string) =>
  api.get("/rental-requests/", { headers: { Authorization: `Bearer ${token}` } });

export const updateRentalStatus = (
  id: number,
  status: "active" | "declined",
  token: string
) =>
  api.put(
    `/rentals/${id}/`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const confirmRental = (rentalId: number, token: string) =>
  api.post(`/rentals/${rentalId}/confirm/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

export const rejectRental = (rentalId: number, token: string) =>
  api.post(`/rentals/${rentalId}/reject/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  }); 
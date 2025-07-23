import api from "@/service/api";

export const addForumComment = (
  complaintId: number,
  text: string,
  token: string
) =>
  api.post(
    `/forum-add/${complaintId}/`,
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const fetchForumFilters = () =>
  api.get("/forum/filters/"); 
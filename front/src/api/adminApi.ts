import api from "@/service/api";

// Dashboard statistics
export const getDashboardStats = () => api.get("/admin/dashboard/stats/");

// Users management
export const getAdminUsers = (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  verification_status?: string;
  is_banned?: string;
}) => api.get("/admin/users/", { params });

export const getAdminUserById = (id: number) => api.get(`/admin/users/${id}/`);

export const banUser = (id: number, reason: string) => 
  api.post(`/admin/users/${id}/ban/`, { reason });

export const unbanUser = (id: number) => 
  api.post(`/admin/users/${id}/unban/`);

export const makeAdmin = (id: number) => 
  api.post(`/admin/users/${id}/make-admin/`);

export const removeAdmin = (id: number) => 
  api.post(`/admin/users/${id}/remove-admin/`);

export const verifyUserDocument = (id: number, approved: boolean, comment?: string) => 
  api.post(`/admin/users/${id}/verify-document/`, { approved, comment });

// Settings management
export const getFAQ = (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
}) => api.get("/admin/settings/faq/", { params });

export const createFAQ = (data: {
  question_ru: string;
  answer_ru: string;
  auto_translate?: boolean;
}) => api.post("/admin/settings/faq/", data);

export const updateFAQ = (id: number, data: {
  question_ru?: string;
  answer_ru?: string;
  auto_translate?: boolean;
}) => api.put(`/admin/settings/faq/${id}/`, data);

export const deleteFAQ = (id: number) => api.delete(`/admin/settings/faq/${id}/`);

export const getComplaintReasons = (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  type?: string;
  is_default?: boolean;
}) => api.get("/admin/settings/complaint-reasons/", { params });

export const createComplaintReason = (data: {
  reason: string;
  reason_kz?: string;
  reason_en?: string;
  type?: string;
  is_default?: boolean;
  order?: number;
}) => api.post("/admin/settings/complaint-reasons/", data);

export const updateComplaintReason = (id: number, data: {
  reason?: string;
  reason_kz?: string;
  reason_en?: string;
  type?: string;
  is_default?: boolean;
  order?: number;
}) => api.put(`/admin/settings/complaint-reasons/${id}/`, data);

export const deleteComplaintReason = (id: number) => api.delete(`/admin/settings/complaint-reasons/${id}/`);

// Activity logs
export const getActivityLogs = (params?: {
  page?: number;
  page_size?: number;
  user_id?: number;
  action_type?: string;
  date_from?: string;
  date_to?: string;
}) => api.get("/admin/logs/activity/", { params });

export const getRecentActivity = (limit: number = 5) => 
  api.get("/admin/logs/activity/", { params: { page_size: limit } });

// System settings
export const getSystemSettings = () => api.get("/admin/settings/system/");

export const updateSystemSettings = (data: Record<string, unknown>) => api.put("/admin/settings/system/", data);

// ==================== COMPLAINT MANAGEMENT ====================

// Complaint list with filters
export const getAdminComplaints = (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
  date_from?: string;
  date_to?: string;
  reason?: number;
  user_iin_bin?: string;
}) => api.get("/admin/complaints/", { params });

// Complaint statistics
export const getComplaintStatistics = () => api.get("/admin/complaints/statistics/");

// Moderate complaint (approve/reject)
export const moderateComplaint = (complaintUuid: string, action: 'approve' | 'reject', adminComment?: string) => 
  api.post(`/admin/complaints/${complaintUuid}/moderate/`, {
    action,
    admin_comment: adminComment || ''
  });

// Get complaint history
export const getComplaintHistory = (complaintUuid: string) => 
  api.get(`/admin/complaints/${complaintUuid}/history/`);



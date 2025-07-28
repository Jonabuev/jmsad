import axios from 'axios';
import { IComplaint } from '../component/type/users.interface';

interface GetComplaintsParams {
  page?: number;
  page_size?: number;
  search?: string;
}

interface GetComplaintsResponse {
  count: number;
  results: IComplaint[];
}

export const getComplaints = async (params: GetComplaintsParams): Promise<GetComplaintsResponse> => {
  // Проверяем, что мы на клиенте
  if (typeof window === 'undefined') {
    throw new Error('Cannot access localStorage on server side');
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get('http://127.0.0.1:8000/api/tenant-registry/', {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}; 
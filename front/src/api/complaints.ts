import axios from 'axios';
import { apiUrl } from '@/utils/url';
import { IComplaint } from '../component/type/users.interface';
import { getValidAccessToken } from '@/utils/tokenUtils';

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
    throw new Error('Cannot access cookies on server side');
  }

  const token = getValidAccessToken();
  if (!token) {
    throw new Error('No access token found');
  }

  const response = await axios.get(apiUrl('/tenant-registry/'), {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}; 
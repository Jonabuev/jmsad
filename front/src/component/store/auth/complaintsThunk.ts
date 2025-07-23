import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchComplaints } from '@/api/complaintsApi';

export const getComplaints = createAsyncThunk(
  'complaints/getComplaints',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchComplaints();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch complaints');
    }
  }
); 
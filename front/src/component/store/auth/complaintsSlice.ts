import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getComplaints } from './complaintsThunk';
import { IComplaint } from '@/component/type/complaints.interface';

interface ComplaintsState {
  complaints: IComplaint[];
  loading: boolean;
  error: string | null;
}

const initialState: ComplaintsState = {
  complaints: [],
  loading: false,
  error: null,
};

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getComplaints.fulfilled, (state, action: PayloadAction<IComplaint[]>) => {
        state.loading = false;
        state.complaints = action.payload;
      })
      .addCase(getComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default complaintsSlice.reducer; 
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { IUser } from "@/component/type/users.interface";

interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  error: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  error: null,
  loading: false,
};

// 🔐 Асинхронный thunk для входа
export const loginUser = createAsyncThunk<
  IUser,
  { identifier: string; password: string },
  { rejectValue: string }
>("auth/loginUser", async ({ identifier, password }, thunkAPI) => {
  const response = await fetch("http://127.0.0.1:8000/api/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    return thunkAPI.rejectWithValue(errorData.detail || "Ошибка входа");
  }

  const data = await response.json();
  localStorage.setItem("access_token", data.access); // JWT
  localStorage.setItem("user", JSON.stringify(data.user)); // пользователь

  return data.user;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
    },
    setUser: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload || "Ошибка входа";
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;

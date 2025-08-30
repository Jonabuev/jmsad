import { useForm } from "react-hook-form";
import { IUser } from "@/component/type/users.interface";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/component/store/store";
import { logout, setAuthenticated, setProfile } from "@/component/store/auth/authSlice";
import { useRouter } from "next/router";

export function useRegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IUser>();

  const onSubmit = (data: IUser) => {
    console.log("Регистрация пользователя:", data);
  };

  return {
    register,
    handleSubmit,
    watch,
    errors,
    onSubmit,
  };
}

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const { profile, loading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const setUserAuthenticated = (authenticated: boolean) => {
    dispatch(setAuthenticated(authenticated));
  };

  const setUserProfile = (profileData: any) => {
    dispatch(setProfile(profileData));
  };

  return {
    profile,
    loading,
    error,
    isAuthenticated,
    handleLogout,
    setUserAuthenticated,
    setUserProfile,
  };
}

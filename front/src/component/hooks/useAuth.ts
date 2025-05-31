import { useForm } from "react-hook-form";
import { IUser } from "@/component/type/users.interface";

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

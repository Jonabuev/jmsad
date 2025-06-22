import { IComplaint } from "@/component/type/users.interface";
import { useApi } from "../useApi";

export function useComplaint(uuid: string | string[] | undefined) {
  const { data: complaint, loading, error } = useApi<IComplaint>(
    `/complaints/${uuid}/`,
    {},
    { skip: !uuid }
  );

  return { complaint, loading, error };
}

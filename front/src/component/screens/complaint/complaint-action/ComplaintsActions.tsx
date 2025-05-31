import { IComplaint } from "@/component/type/users.interface";

interface IComplaintInfoProps {
  complaint: IComplaint;
  t: (key: string) => string;
  onUpdate: (id: number, status: "reviewed" | "rejected") => void;
}

const ComplaintActionsButtons = ({
  complaint,
  t,
  onUpdate,
}: IComplaintInfoProps) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onUpdate(complaint.id, "reviewed")}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
      >
        {t("complaint.approve")}
      </button>
      <button
        onClick={() => onUpdate(complaint.id, "rejected")}
        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
      >
        {t("complaint.reject")}
      </button>
    </div>
  );
};

export default ComplaintActionsButtons;

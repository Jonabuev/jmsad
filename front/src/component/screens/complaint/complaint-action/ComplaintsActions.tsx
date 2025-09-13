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
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Действия администратора</h3>
        <p className="text-sm text-gray-600 mb-6">Выберите действие для данной жалобы</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onUpdate(complaint.id, "reviewed")}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("complaint.approve")}
        </button>
        
        <button
          onClick={() => onUpdate(complaint.id, "rejected")}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {t("complaint.reject")}
        </button>
      </div>
    </div>
  );
};

export default ComplaintActionsButtons;

// components/AdminComplaintsTable.tsx

import { FC } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { IComplaint } from "@/component/type/users.interface";

interface Props {
  complaints: IComplaint[];
}

const AdminComplaintsTable: FC<Props> = ({ complaints }) => {
  const { t } = useTranslation();

  if (!complaints || complaints.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 min-w-[280px] mt-5">
      <div className="mt-8">
        <h2 className="font-semibold mb-2 text-gray-700">
          {t("profile.adminComplaints")}
        </h2>
        <table className="w-full text-left border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b">{t("profile.complaints")}</th>
              <th className="p-2 border-b">{t("profile.status")}</th>
              <th className="p-2 border-b">{t("profile.details")}</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr key={complaint.id} className="border-t">
                <td className="p-2">{complaint.description}</td>
                <td className="p-2 capitalize">{complaint.status}</td>
                <td className="p-2 capitalize">
                  <Link href={`/complaints/${complaint.uuid}`}>
                    {t("profile.details")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminComplaintsTable;

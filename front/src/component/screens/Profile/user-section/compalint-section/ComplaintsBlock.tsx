import { FC } from "react";
import Link from "next/link";
import { IProfileData, IComplaint } from "@/component/type/users.interface";

interface Props {
  profileData: IProfileData;
  t: (key: string) => string;
  handleDispute: (id: number, newDesc: string) => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ComplaintsBlock: FC<Props> = ({ profileData, t, handleDispute }) => {
  const { complaint_received, complaint_send, email_confirmed } = profileData;

  return (
    <div className="mt-5 p-4 rounded-lg shadow bg-white">
      {profileData.user.email_confirmed ? (<div className="flex justify-between">
        <h2 className="font-semibold mb-2 text-gray-700">
          {t("profile.complaints")}
        </h2>
        <Link href="/profile/add-complaint" className="text-blue-600">
          {t("profile.addComplaint")}
        </Link>
      </div>
      ) : (
        <p className="text-gray-500"></p>
      )}

      {!complaint_received?.length && !complaint_send?.length ? (
        <p className="text-gray-500">{t("profile.noComplaints")}.</p>
      ) : (
        <div className="space-y-8">
          {complaint_send?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("profile.sentComplaints")}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2">
                        {t("profile.description")}
                      </th>
                      <th className="border px-4 py-2">
                        {t("profile.status")}
                      </th>
                      <th className="border px-4 py-2">{t("profile.date")}</th>
                      <th className="border px-4 py-2">
                        {t("profile.details")}
                      </th>
                      <th className="border px-4 py-2">
                        {t("profile.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaint_received.map((c: IComplaint) => (
                      <tr key={c.id} className="text-center">
                        <td className="border px-4 py-2">{c.description}</td>
                        <td className="border px-4 py-2">
                          {t(`profile.${c.status}`)}
                        </td>
                        <td className="border px-4 py-2">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="border px-4 py-2">
                          <Link
                            href={`/complaints/${c.uuid}`}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {t("profile.details")}
                          </Link>
                        </td>
                        <td className="border px-4 py-2">
                        {c.status === "rejected" && (
                            <Link
                              href={`/complaints/${c.uuid}/edit`}
                              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                            >
                              {t("profile.dispute")}
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {complaint_send?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("profile.receivedComplaints")}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2">
                        {t("profile.description")}
                      </th>
                      <th className="border px-4 py-2">
                        {t("profile.status")}
                      </th>
                      <th className="border px-4 py-2">{t("profile.date")}</th>
                      <th className="border px-4 py-2">
                        {t("profile.details")}
                      </th>
                      <th className="border px-4 py-2">
                        {t("profile.action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaint_send.map((c: IComplaint) => (
                      <tr key={c.id} className="text-center">
                        <td className="border px-4 py-2">{c.description}</td>
                        <td className="border px-4 py-2">
                          {t(`profile.${c.status}`)}
                        </td>
                        <td className="border px-4 py-2">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="border px-4 py-2">
                          <Link
                            href={`/complaints/${c.uuid}`}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {t("profile.details")}
                          </Link>
                        </td>
                        <td className="border px-4 py-2">
                            {c.status === "reviewed" && (
                              <Link
                                href={`/complaints/${c.uuid}/dispute`}
                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                              >
                                {t("profile.dispute")}
                              </Link>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComplaintsBlock;

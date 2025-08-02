import { FC } from "react";
import Link from "next/link";
import { IProfileData } from "@/component/type/users.interface";

const GeneralInfo: FC<{
  profileData: IProfileData;
  t: (key: string) => string;
}> = ({ profileData, t }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 min-w-[300px] space-y-4">
    <h2 className="font-semibold text-lg text-gray-800 border-b pb-2">
      {t("profile.generalInfo")}
    </h2>
    <p className="text-gray-700">
      <strong>{t("profile.iin")}:</strong> {profileData.user.identifier}
    </p>
    <p className="text-gray-700">
      <strong>{t("profile.role")}:</strong>{" "}
      {profileData.user.role === "landlord" ? "Арендодатель" : "Арендатор"}
    </p>
    {/* <p className="text-gray-700">
      <strong>{t("profile.rating")}:</strong> {profileData.user.rating}
    </p> */}
    <p className="text-gray-700">
      <strong>{t("profile.phone")}:</strong> {profileData.user.phone_number}
    </p>
    <p className="text-gray-700 flex items-center">
      <strong>{t("profile.email")}:</strong> {profileData.user.email}
      {profileData.user.email_confirmed ? (
        <span className="ml-2 text-green-600 bg-green-100 px-2 py-1 rounded">
          {t("profile.verified")}
        </span>
      ) : (
        <Link href="/profile/verify">
          <button className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            {t("profile.notverify")}
          </button>
        </Link>
      )}
    </p>
  </div>
);

export default GeneralInfo;

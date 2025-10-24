import { FC } from "react";
import Link from "next/link";
import { IProfileData } from "@/component/type/users.interface";

const GeneralInfo: FC<{
  profileData: IProfileData;
  t: (key: string) => string;
}> = ({ profileData, t }) => (
  <div className="p-3 sm:p-6">
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-3 sm:p-6 border border-gray-200">
      <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">{t("profile.generalInfo")}</h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-tight break-words">{t("profile.basicProfileInfo")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Account Information */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            {t("profile.accountInfo")}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">{t("profile.username")}</p>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">{profileData.user.username}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">{t("profile.role")}</p>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base">
                    {profileData.user.role === "landlord" ? t("profile.landlord") : t("profile.tenant")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">{t("profile.verificationStatus")}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      {profileData.user.email_confirmed ? t("profile.confirmed") : t("profile.notConfirmed")}
                    </p>
                    {profileData.user.email_confirmed ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✓ {t("profile.active")}
                      </span>
                    ) : (
                      <Link href="/profile/verify">
                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors">
                          {t("profile.confirm")}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            {t("profile.contactInfo")}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">{t("profile.email")}</p>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base break-all overflow-hidden">{profileData.user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">{t("profile.phone")}</p>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                    {profileData.user.phone_number || t("profile.noPhone")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600">{t("profile.iin")}</p>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                    {profileData.user.identifier || t("profile.noIIN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default GeneralInfo;

import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import { IProfileData } from "@/component/type/users.interface";
import { verifyUserDocument } from "@/api/adminApi";
import { useAdminNotifications } from "@/component/hooks/useAdminNotifications";
import AdminNotification from "../AdminNotification";

interface DocumentVerificationProps {
  user: IProfileData;
  onVerificationChange: () => void;
}

const DocumentVerification: FC<DocumentVerificationProps> = ({ user, onVerificationChange }) => {
  const { t } = useTranslation("common");
  const { notifications, addNotification, removeNotification } = useAdminNotifications();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  const handleVerification = async (approved: boolean) => {
    try {
      setLoading(true);
      await verifyUserDocument(user.id, approved, comment);
      
      if (approved) {
        addNotification('success', t('admin.verificationApprovedSuccessfully'));
      } else {
        addNotification('success', t('admin.verificationRejectedSuccessfully'));
      }
      
      onVerificationChange();
      setComment("");
    } catch (error: any) {
      console.error("Error verifying document:", error);
      addNotification('error', error.message || t('admin.errorVerifyingDocument'));
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (user.email_confirmed) {
      return {
        status: "verified",
        text: t("admin.verified"),
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    }
    return {
      status: "pending",
      text: t("admin.pendingVerification"),
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    };
  };

  const verificationStatus = getVerificationStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t("admin.documentVerification")}</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${verificationStatus.bgColor} ${verificationStatus.color} border ${verificationStatus.borderColor}`}>
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            {verificationStatus.status === "verified" ? (
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
            )}
          </svg>
          {verificationStatus.text}
        </div>
      </div>

      {/* User Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">{t("admin.userInformation")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">{t("admin.fullName")}</dt>
            <dd className="text-gray-900">{user.username}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin.email")}</dt>
            <dd className="text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin.phone")}</dt>
            <dd className="text-gray-900">{user.phone_number || t("admin.notProvided")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin.identifier")}</dt>
            <dd className="text-gray-900">{user.identifier || t("admin.notProvided")}</dd>
          </div>
        </div>
      </div>

      {/* Document Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">{t("admin.documentInformation")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">{t("admin.documentType")}</dt>
            <dd className="text-gray-900">
              {user.document_type === "id_card" ? t("admin.idCard") :
               user.document_type === "passport_kz" ? t("admin.passportKz") :
               user.document_type === "visa" ? t("admin.visa") : t("admin.notProvided")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin.passportExpiry")}</dt>
            <dd className="text-gray-900">{user.passport_expiry || t("admin.notProvided")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin.citizenship")}</dt>
            <dd className="text-gray-900">{user.user?.citizenship || t("admin.notProvided")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin.visaNumber")}</dt>
            <dd className="text-gray-900">{user.user?.visa_number || t("admin.notProvided")}</dd>
          </div>
        </div>
      </div>

      {/* Neural Network Analysis */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-3">{t("admin.neuralNetworkAnalysis")}</h4>
        <div className="text-sm text-blue-800">
          <p className="mb-2">{t("admin.neuralNetworkDescription")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-blue-700 font-medium">{t("admin.extractedName")}</dt>
              <dd className="text-blue-900">{user.username}</dd>
            </div>
            <div>
              <dt className="text-blue-700 font-medium">{t("admin.extractedIin")}</dt>
              <dd className="text-blue-900">{user.identifier || t("admin.notExtracted")}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Actions */}
      {verificationStatus.status === "pending" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              {t("admin.verificationComment")}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={t("admin.verificationCommentPlaceholder")}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVerification(true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {t("admin.approveVerification")}
            </button>

            <button
              onClick={() => handleVerification(false)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {t("admin.rejectVerification")}
            </button>
          </div>
        </div>
      )}

      {verificationStatus.status === "verified" && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 font-medium">{t("admin.verificationCompleted")}</p>
          </div>
          <p className="text-green-700 text-sm mt-1">{t("admin.verificationCompletedMessage")}</p>
        </div>
      )}

      {/* Notifications */}
      {notifications.map((notification) => (
        <AdminNotification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default DocumentVerification;

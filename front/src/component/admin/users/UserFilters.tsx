import { FC, useState } from "react";
import { useTranslation } from "next-i18next";

interface UserFiltersProps {
  filters: {
    search: string;
    role: string;
    verification_status: string;
    is_banned: string;
  };
  onFilterChange: (filters: any) => void;
  loading: boolean;
}

const UserFilters: FC<UserFiltersProps> = ({ filters, onFilterChange, loading }) => {
  const { t } = useTranslation("common");
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: "",
      role: "",
      verification_status: "",
      is_banned: "",
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t("admin.filters")}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <svg className={`w-4 h-4 mr-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showFilters ? t("admin.hideFilters") : t("admin.showFilters")}
          </button>
        </div>

        {/* Quick Search */}
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            {t("admin.search")}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={localFilters.search}
              onChange={(e) => handleInputChange("search", e.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Role Filter */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.role")}
              </label>
              <select
                id="role"
                value={localFilters.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("admin.allRoles")}</option>
                <option value="tenant">{t("profile.tenant")}</option>
                <option value="landlord">{t("profile.landlord")}</option>
              </select>
            </div>

            {/* Verification Status Filter */}
            <div>
              <label htmlFor="verification_status" className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.verificationStatus")}
              </label>
              <select
                id="verification_status"
                value={localFilters.verification_status}
                onChange={(e) => handleInputChange("verification_status", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("admin.allStatuses")}</option>
                <option value="verified">{t("admin.verified")}</option>
                <option value="pending">{t("admin.pending")}</option>
                <option value="rejected">{t("admin.rejected")}</option>
              </select>
            </div>

            {/* Ban Status Filter */}
            <div>
              <label htmlFor="is_banned" className="block text-sm font-medium text-gray-700 mb-2">
                {t("admin.accountStatus")}
              </label>
              <select
                id="is_banned"
                value={localFilters.is_banned}
                onChange={(e) => handleInputChange("is_banned", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("admin.allStatuses")}</option>
                <option value="false">{t("admin.active")}</option>
                <option value="true">{t("admin.banned")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {t("admin.applyFilters")}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t("admin.resetFilters")}
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="text-sm text-gray-500">
              {t("admin.activeFilters")}: {Object.values(filters).filter(value => value !== "").length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFilters;

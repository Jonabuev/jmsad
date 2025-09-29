import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import styles from "./UserFilters.module.scss";

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
    <div className={styles.filtersCard}>
      <div className={styles.filtersContent}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>{t("admin.filters")}</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.toggleButton}
          >
            <svg className={`${styles.toggleIcon} ${showFilters ? styles.toggleIconRotated : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showFilters ? t("admin.hideFilters") : t("admin.showFilters")}
          </button>
        </div>

        {/* Quick Search */}
        <div className={styles.searchSection}>
          <label htmlFor="search" className={styles.searchLabel}>
            {t("admin.search")}
          </label>
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}>
              <svg className={styles.searchIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={localFilters.search}
              onChange={(e) => handleInputChange("search", e.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className={styles.advancedFilters}>
            {/* Role Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="role" className={styles.filterLabel}>
                {t("admin.role")}
              </label>
              <select
                id="role"
                value={localFilters.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">{t("admin.allRoles")}</option>
                <option value="tenant">{t("profile.tenant")}</option>
                <option value="landlord">{t("profile.landlord")}</option>
              </select>
            </div>

            {/* Verification Status Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="verification_status" className={styles.filterLabel}>
                {t("admin.verificationStatus")}
              </label>
              <select
                id="verification_status"
                value={localFilters.verification_status}
                onChange={(e) => handleInputChange("verification_status", e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">{t("admin.allStatuses")}</option>
                <option value="verified">{t("admin.verified")}</option>
                <option value="pending">{t("admin.pending")}</option>
                <option value="rejected">{t("admin.rejected")}</option>
              </select>
            </div>

            {/* Ban Status Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="is_banned" className={styles.filterLabel}>
                {t("admin.accountStatus")}
              </label>
              <select
                id="is_banned"
                value={localFilters.is_banned}
                onChange={(e) => handleInputChange("is_banned", e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">{t("admin.allStatuses")}</option>
                <option value="false">{t("admin.active")}</option>
                <option value="true">{t("admin.banned")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Actions */}
        <div className={styles.filterActions}>
          <div className={styles.filterButtons}>
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className={styles.applyButton}
            >
              {loading ? (
                <div className={styles.applyButtonSpinner}></div>
              ) : (
                <svg className={styles.applyButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {t("admin.applyFilters")}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                disabled={loading}
                className={styles.resetButton}
              >
                <svg className={styles.resetButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t("admin.resetFilters")}
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className={styles.activeFiltersInfo}>
              {t("admin.activeFilters")}: {Object.values(filters).filter(value => value !== "").length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserFilters;

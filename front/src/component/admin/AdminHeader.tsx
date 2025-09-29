import { FC, useState } from "react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import styles from "./AdminHeader.module.scss";

const AdminHeader: FC = () => {
  const { t } = useTranslation("common");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          {/* Page title */}
          <div>
            <h1 className={styles.pageTitle}>{t("admin.dashboard")}</h1>
            <p className={styles.pageSubtitle}>{t("admin.dashboardSubtitle")}</p>
          </div>

          {/* Right side */}
          <div className={styles.rightSide}>
            {/* Notifications */}
            <button className={styles.notificationButton}>
              <svg className={styles.notificationIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L16 7l-6 6-6-6z" />
              </svg>
              <span className={styles.notificationBadge}></span>
            </button>

            {/* Profile dropdown */}
            <div className={styles.profileDropdown}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={styles.profileButton}
              >
                <div className={styles.profileAvatar}>
                  <svg className={styles.profileAvatarIcon} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>Admin</p>
                  <p className={styles.profileRole}>Administrator</p>
                </div>
                <svg className={styles.profileDropdownIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isProfileOpen && (
                <div className={styles.dropdownMenu}>
                  <Link
                    href="/profile"
                    className={styles.dropdownItem}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg className={styles.dropdownItemIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t("admin.profile")}
                  </Link>
                  <Link
                    href="/admin/settings"
                    className={styles.dropdownItem}
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <svg className={styles.dropdownItemIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("admin.settingsMenu")}
                  </Link>
                  <div className={styles.dropdownDivider}></div>
                  <button
                    onClick={() => {
                      // Handle logout
                      setIsProfileOpen(false);
                    }}
                    className={styles.dropdownLogoutButton}
                  >
                    <svg className={styles.dropdownLogoutIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("admin.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

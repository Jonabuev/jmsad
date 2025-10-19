import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { MyComponent } from "@/component/star/Star";
import { ITenant } from "@/component/type/users.interface";
import { useTranslation } from "next-i18next";
import { getCookie } from "@/utils/cookieUtils";
import { fetchComplaintReasons, fetchTenants, fetchLandlords } from "@/api/searchApi";
import { getVerificationStatus } from "@/api/userApi";
import { useSelector } from "react-redux";
import { RootState } from "@/component/store/store";
import styles from "./SearchPage.module.scss";

interface IComplaintReason {
  id: number;
  reason_text: string;
  type: string;
  order: number;
}

const TenantRegistry: React.FC = () => {
  const { t } = useTranslation("common");
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<"tenants" | "landlords">("tenants");
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [iin, setIin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [courtScore, setCourtScore] = useState("");
  const [reasons, setReasons] = useState<IComplaintReason[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<number[]>([]);
  const [users, setUsers] = useState<ITenant[]>([]);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const router = useRouter();

  // Функция для проверки статуса верификации
  const checkVerificationStatus = async () => {
    try {
      const token = getCookie("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await getVerificationStatus();
      const isUserVerified = response.data.is_verified ?? response.data.email_confirmed;
      setIsVerified(isUserVerified);
      if (!isUserVerified) {
        router.push("/profile?verification_required=true");
      }

    } catch (error: any) {
      console.error("Ошибка при проверке статуса верификации:", error);
      
      // Проверяем тип ошибки
      if (error.response?.status === 401) {
        // Только при ошибке авторизации перенаправляем на логин
        router.push("/login");
      } else {
        // При других ошибках (сеть, сервер) не перенаправляем
        // Просто устанавливаем статус как неверифицированный
        setIsVerified(false);
      }
    }
  };

  // Проверяем верификацию при загрузке компонента
  useEffect(() => {
    // Добавляем задержку для восстановления токенов при перезагрузке
    const timeoutId = setTimeout(() => {
      const token = getCookie("access_token");
      
      if (token && !verificationChecked) {
        // Если есть токен, но isAuthenticated еще false (при перезагрузке)
        checkVerificationStatus();
        setVerificationChecked(true);
      } else if (isAuthenticated && !verificationChecked) {
        // Если isAuthenticated уже true
        checkVerificationStatus();
        setVerificationChecked(true);
      } else if (!token && !isAuthenticated) {
        // Если нет токена и не авторизован
        router.push("/login");
      }
    }, 200); // Даем время на восстановление токенов

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, verificationChecked]); // Добавляем verificationChecked в зависимости

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const token = getCookie("access_token");
        if (!token) {
          console.error("No token found");
          return;
        }
        const locale = router.locale || 'ru';
        // Запрашиваем причины с фильтрацией по типу на бэкенде
        const type = activeTab === "tenants" ? "tenant" : "landlord";
        const res = await fetchComplaintReasons(locale, type);
        setReasons(res.data);
      } catch (error) {
        console.error("Ошибка загрузки причин жалоб:", error);
      }
    };
    fetchReasons();
  }, [activeTab]);

  const toggleReason = (id: number) => {
    setSelectedReasons((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const getTranslatedReasons = (reasonsStr: string) => {
    if (!reasonsStr) return "-";
    const keys = reasonsStr.split(",").map((s) => s.trim()).filter(Boolean);
    return keys.map((key) => t(`search.reason.${key}`)).join(", ");
  };

  const fetchUsers = useCallback(async () => {
    try {
      const token = getCookie("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if(fullName) params.search = fullName;
      if(iin) params.search = iin;
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      if (addressQuery) params.address = addressQuery;
      if (courtScore) params.court_decision_score = courtScore;
      if (selectedReasons.length > 0) {
        params.reasons = selectedReasons.join(",");
      }
      let res;
      if (activeTab === "tenants") {
        res = await fetchTenants(params, token);
      } else {
        res = await fetchLandlords(params, token);
      }
      setUsers(res.data);
    } catch (error) {
      console.error("Ошибка при загрузке:", error);
    }
  }, [activeTab, router, searchQuery, startDate, endDate, addressQuery, courtScore, selectedReasons, iin, fullName]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  useEffect(() => {
          setIin("");
          setFullName("");
          setStartDate("");
          setEndDate("");
          setAddressQuery("");
          setCourtScore("");
          setSelectedReasons([]);
        }, [activeTab]);
  // Показываем загрузку пока проверяем верификацию или восстанавливаем токены
  if (isVerified === null || (!isAuthenticated && getCookie("access_token"))) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingText}>{t("loading")}</div>
        </div>
      </div>
    );
  }

  // Если пользователь не верифицирован, не показываем контент (будет редирект)
  if (!isVerified) {
    return null;
  }

  return (
    <div className={styles.searchPage}>
      <div className={styles.container}>
        {/* Заголовок с двуязычным названием */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {t("profile.search.title")}
          </h1>
        </div>

        {/* Табы */}
        <div className={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab("tenants")}
            className={`${styles.tabButton} ${activeTab === "tenants" ? styles.active : ""}`}
          >
            {t("profile.search.tenants")}
          </button>
          <button
            onClick={() => setActiveTab("landlords")}
            className={`${styles.tabButton} ${activeTab === "landlords" ? styles.active : ""}`}
          >
            {t("profile.search.landlords")}
          </button>
        </div>
        
        {/* Секция поиска и фильтров */}
        <div className={styles.searchSection}>
          <div className={styles.searchGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("profile.search.fullName")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.fullNamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("search.iin")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.iinPlaceholder")}
                value={iin}
                onChange={(e) => setIin(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("profile.search.address")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.addressPlaceholder")}
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("profile.search.courtDecisionNumber")}
              </label>
              <input
                type="text"
                placeholder={t("profile.search.courtDecisionPlaceholder")}
                value={courtScore}
                onChange={(e) => setCourtScore(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Диапазон дат */}
          <div className={styles.dateGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("profile.search.from")}
              </label>
              <div className={styles.dateInputWrapper}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.input}
                />
                <div className={styles.dateIcon}>
                  📅
                </div>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>
                {t("profile.search.to")}
              </label>
              <div className={styles.dateInputWrapper}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                />
                <div className={styles.dateIcon}>
                  📅
                </div>
              </div>
            </div>
          </div>
          {/* Причины жалоб */}
          <div className={styles.reasonsSection}>
            <h3 className={styles.reasonsTitle}>{t("search.filter_reasons")}</h3>
            <div className={styles.reasonsGrid}>
              {reasons.map((reason) => (
                <label key={reason.id} className={styles.reasonLabel}>
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason.id)}
                    onChange={() => toggleReason(reason.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.reasonText}>{reason.reason_text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className={styles.actionsContainer}>
            <button
              onClick={fetchUsers}
              className={styles.searchButton}
            >
              {t("profile.search.search")}
            </button>
            <Link
              href="/profile/add-complaint"
              className={styles.complaintButton}
            >
              {t("profile.search.submitComplaint")}
            </Link>
          </div>
        </div>




        {/* Результаты поиска */}
        {users.length === 0 ? (
          <div className={styles.noDataContainer}>
            <p className={styles.noDataText}>{t("search.noData")}</p>
          </div>
        ) : (
          <div className={styles.resultsContainer}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeader}>
                      {activeTab === "tenants" ? t("search.tenant") : t("search.tenant")}
                    </th>
                    <th className={styles.tableHeader}>
                      {t("profile.search.iin")}
                    </th>
                    <th className={styles.tableHeader}>
                      {t("profile.search.complaintCount")}
                    </th>
                    <th className={styles.tableHeader}>
                      {t("profile.search.complaintDates")}
                    </th>
                    <th className={styles.tableHeader}>
                      {t("profile.search.courtDecisionNumber")}
                    </th>
                    <th className={styles.tableHeader}>
                      {t("profile.search.complaintReasonsColumn")}
                    </th>
                    <th className={styles.tableHeader}>
                      {t("profile.search.profile")}
                    </th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {users.map((user, index) => (
                    <tr key={user.identifier} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.tableCellFlex}>
                          <div className={styles.userName}>{user.username}</div>
                        </div>
                      </td>
                      <td className={`${styles.tableCell} ${styles.identifier}`}>
                        {user.identifier}
                      </td>
                      <td className={styles.tableCell}>
                        {user.complaint_count ?? 0}
                      </td>
                      <td className={styles.tableCell}>
                        {user.complaint_dates && user.complaint_dates.length > 0
                          ? user.complaint_dates
                              .map((date) => new Date(date).toLocaleDateString("ru-RU"))
                              .join(", ")
                          : "-"}
                      </td>
                      <td className={styles.tableCell}>
                        {user.court_scores || "-"}
                      </td>
                      <td className={`${styles.tableCell} ${styles.complaintReasons}`}>
                        <div className={styles.truncatedText}>
                          {getTranslatedReasons(user.complaint_reasons)}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <Link
                          href={`/user/${user.username}`}
                          className={styles.profileLink}
                        >
                          {t("profile.search.viewProfile")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Пагинация */}
            <div className={styles.paginationContainer}>
              <div className={styles.paginationContent}>
                <div className={styles.paginationInfo}>
                  {t("profile.search.showingRecords", { count: users.length })}
                </div>
                <div className={styles.paginationButtons}>
                  <button className={styles.paginationButton}>
                    {t("profile.search.previous")}
                  </button>
                  <button className={`${styles.paginationButton} ${styles.active}`}>
                    1
                  </button>
                  <button className={styles.paginationButton}>
                    2
                  </button>
                  <span className={styles.paginationEllipsis}>...</span>
                  <button className={styles.paginationButton}>
                    10
                  </button>
                  <button className={styles.paginationButton}>
                    {t("profile.search.next")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantRegistry;
import { useDateRange } from "@/component/hooks/catalog-rental/useDateRange";
import { useRentals } from "@/component/hooks/catalog-rental/useRentals";
import axios from "axios";
import { useTranslation } from "react-i18next";
import RentalDatePicker from "./rental-date/RentalDatePicker";
import LoadingIndicator from "./loading/LoadingIndicator";
import RentalMap from "./rental-map/RentalMap";

export default function RentalCatalog() {
  const { t } = useTranslation();
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange();
  const { rentals, loading, fetchData } = useRentals(startDate, endDate);

  const handleRent = (houseId: number) => {
    if (!startDate || !endDate) {
      alert(t("rentalCatalog.selectDates"));
      return;
    }
    axios
      .post(
        "http://127.0.0.1:8000/api/rent-house/",
        {
          house_id: houseId,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      )
      .then(() => alert(t("rentalCatalog.requestSent")))
      .catch(() => alert(t("rentalCatalog.requestFailed")));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏠 {t("rentalCatalog.title")}</h1>
      <RentalDatePicker
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        onSearch={fetchData}
        buttonText={t("rentalCatalog.find")}
      />
      {loading ? (
        <LoadingIndicator text={t("rentalCatalog.loading")} />
      ) : (
        <RentalMap rentals={rentals} onRentClick={handleRent} />
      )}
    </div>
  );
}

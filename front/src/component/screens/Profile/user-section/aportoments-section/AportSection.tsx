import { FC, useState } from "react";
import Link from "next/link";
import { confirmRental, rejectRental } from "@/api/rentalApi";
import {
  IProfileData,
  IHouse,
  IRental,
} from "@/component/type/users.interface";
import { getCookie } from "@/utils/cookieUtils";

interface Props {
  profileData: IProfileData;
  t: (key: string) => string;
}

const ApartmentsBlock: FC<Props> = ({ profileData, t }) => {
  const emailConfirmed = profileData.user.email_confirmed;
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const handleConfirmRental = async (rentalId: number) => {
    try {
      setLoading(prev => ({ ...prev, [rentalId]: true }));
      setError(null);
      const token = getCookie("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      await confirmRental(rentalId, token);
      window.location.reload();
    } catch (error: any) {
      console.error("Error confirming rental:", error);
      setError(error.response?.data?.error || t("profile.confirmationError"));
    } finally {
      setLoading(prev => ({ ...prev, [rentalId]: false }));
    }
  };

  const handleRejectRental = async (rentalId: number) => {
    try {
      setLoading(prev => ({ ...prev, [rentalId]: true }));
      setError(null);
      const token = getCookie("access_token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      await rejectRental(rentalId, token);
      window.location.reload();
    } catch (error: any) {
      console.error("Error rejecting rental:", error);
      setError(error.response?.data?.error || t("profile.rejectionError"));
    } finally {
      setLoading(prev => ({ ...prev, [rentalId]: false }));
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 min-w-[280px]">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex justify-between mb-4">
        <h2 className="font-semibold text-gray-700">{t("profile.myApartments")}</h2>
        {emailConfirmed && (
          <Link href="/profile/add-aport" className="text-blue-600">
            {t("profile.addProperty")}
          </Link>
        )}
      </div>

      {profileData.houses?.length ? (
        <ul className="space-y-2">
          {profileData.houses.map((house: IHouse) => (
            <li
              key={house.id}
              className="bg-gray-100 p-3 rounded-md shadow-sm"
            >
              <p>
                <strong>{house.address}</strong>
              </p>
              <p>
                {t(`profile.${house.type_p}`)} • {t("profile.rooms")}:{" "}
                {house.num_of_rooms}
              </p>
              {profileData.rentals_all
                ?.filter((rental) => rental.house.id === house.id)
                .map((rental) => (
                  <div key={rental.id} className="mt-2 border-t pt-2">
                    <p>
                      <strong>{t("profile.tenant")}:</strong>{" "}
                      {rental.tenant.username}
                    </p>
                    <p>
                      <strong>{t("profile.rentalStatus")}:</strong>{" "}
                      {t(`profile.${rental.status}`)}
                    </p>
                    <p>
                      <strong>{t("profile.date")}:</strong>{" "}
                      {new Date(rental.start_date).toLocaleDateString()} -{" "}
                      {new Date(rental.end_date).toLocaleDateString()}
                    </p>
                    {rental.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleConfirmRental(rental.id)}
                          disabled={loading[rental.id]}
                          className={`bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition ${
                            loading[rental.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {loading[rental.id] ? t("profile.loading") : t("profile.confirm")}
                        </button>
                        <button
                          onClick={() => handleRejectRental(rental.id)}
                          disabled={loading[rental.id]}
                          className={`bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition ${
                            loading[rental.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {loading[rental.id] ? t("profile.loading") : t("profile.reject")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">{t("profile.noAddedHomes")}</p>
      )}

      {profileData.rentals?.length ? (
        <div className="mt-6">
          <h3 className="font-semibold mb-2 text-gray-700">{t("profile.rentalStatus")}</h3>
          <ul className="space-y-2">
            {profileData.rentals.map((rental: IRental) => (
              <li
                key={rental.id}
                className="bg-gray-100 p-3 rounded-md shadow-sm"
              >
                <p>
                  <strong>
                    {rental.house.city}, {rental.house.address}
                  </strong>
                </p>
                <p>
                  {t(`profile.${rental.house.type_p}`)} • {t("profile.rooms")}
                  : {rental.house.num_of_rooms}
                </p>
                <p>
                  <strong>{t("profile.rentalStatus")}:</strong>{" "}
                  {t(`profile.${rental.status}`)}
                </p>
                <p>
                  <strong>{t("profile.date")}:</strong>{" "}
                  {new Date(rental.start_date).toLocaleDateString()} -{" "}
                  {new Date(rental.end_date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default ApartmentsBlock;

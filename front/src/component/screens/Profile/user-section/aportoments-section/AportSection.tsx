import { FC } from "react";
import Link from "next/link";
import {
  IProfileData,
  IHouse,
  IRental,
} from "@/component/type/users.interface";

interface Props {
  profileData: IProfileData;
  t: (key: string) => string;
}

const ApartmentsBlock: FC<Props> = ({ profileData, t }) => {
  const isLandlord = profileData.user.role === "landlord";

  return (
    <div className="bg-white p-4 rounded-lg shadow flex-1 min-w-[280px]">
      {isLandlord ? (
        <>
          <div className="flex justify-between">
            <h2 className="font-semibold mb-2 text-gray-700">
              {t("profile.myApartments")}
            </h2>
            <Link href="/profile/add-aport" className="text-blue-600">
              {t("profile.addProperty")}
            </Link>
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
                      <p key={rental.id}>
                        <strong>{t("profile.rentalStatus")}:</strong>{" "}
                        {t(`profile.${rental.status}`)}
                      </p>
                    ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{t("profile.noAddedHomes")}</p>
          )}
        </>
      ) : (
        <>
          {profileData.rentals?.length ? (
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{t("profile.noAddedHomes")}</p>
          )}
        </>
      )}
    </div>
  );
};

export default ApartmentsBlock;

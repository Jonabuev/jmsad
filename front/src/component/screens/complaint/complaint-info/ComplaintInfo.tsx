import { IComplaint } from "@/component/type/users.interface";

interface IComplaintInfoProps {
  complaint: IComplaint;
  t: (key: string) => string;
}

const ComplaintInfo = ({ complaint, t }: IComplaintInfoProps) => {
  return (
    <>
      <p className="mb-2">
        <strong>{t("complaint.description")}:</strong> {complaint.description}
      </p>
      <p className="mb-2">
        <strong>{t("complaint.rating")}:</strong> {complaint.rating}
      </p>
      <p className="mb-2">
        <strong>{t("complaint.status")}:</strong>{" "}
        {t(`complaint.${complaint.status}`)}
      </p>
      <p className="mb-2">
        <strong>{t("complaint.complainant")}:</strong>{" "}
        {complaint.complainant.username || complaint.complainant.email}
      </p>
      <p className="mb-2">
        <strong>{t("complaint.accused")}:</strong> {complaint.accused?.username}
      </p>
      <p className="mb-2">
        <strong>{t("complaint.property")}:</strong>{" "}
        {complaint.property?.address}
      </p>

      <div className="mb-2">
        <strong>{t("complaint.reasons")}:</strong>
        <ul className="list-disc list-inside">
          {complaint.reasons.map((reason) => (
            <li key={reason.id}>
              {t(`complaint.reason.${reason.reason}`) || reason.reason}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default ComplaintInfo;


import { IComplaint } from "@/component/type/users.interface";
import { FC } from "react";

interface Props {
  complaint: IComplaint;
  t: any;
}
        

const ComplaintInfo: FC<Props> = ({ complaint, t }) => {
  console.log("images:", complaint.images); // ← сюда
  return (
    <div className="space-y-4">
      <div>
        <strong>{t("complaint.description")}:</strong> {complaint.description}
      </div>

      <div>
        <strong>{t("complaint.status")}:</strong> {t(`complaint.${complaint.status}`)}
      </div>

      <div>
        <strong>{t("complaint.rating")}:</strong> {complaint.rating}
      </div>

      <div>
        <strong>{t("complaint.complainant")}:</strong> {complaint.complainant?.username}
      </div>

      <div>
        <strong>{t("complaint.accused")}:</strong> {complaint.accused?.username}
      </div>

      <div>
        <strong>{t("complaint.property")}:</strong>{" "}
        {complaint.property?.city}, {complaint.property?.address}
      </div>

      <div>
        <strong>{t("complaint.reasons")}:</strong>{" "}
        {complaint.reasons.map((r, i) => (
          <span key={r.id}>{r.reason}{i !== complaint.reasons.length - 1 ? ", " : ""}</span>
        ))}
      </div>

      {complaint.court_decision_score && (
        <div>
          <strong>{t("complaint.courtDecision")}:</strong> {complaint.court_decision_score}
        </div>
      )}
      {complaint.images && complaint.images.length > 0 && (
          <div>
          <strong>{t("complaint.attachedImages")}:</strong>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {complaint.images.map((img: string, i: number) => (
              <a
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                key={i}
                className="block"
              >
                <img
                  src={`http://127.0.0.1:8000${img.startsWith("/") ? img : "/" + img}`}
                  alt={`image-${i + 1}`}
                  className="w-full h-auto rounded shadow-md hover:opacity-80"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* История оспариваний */}
      {complaint.disputes.length > 0 && (
        <div>
          <strong>{t("complaint.disputeHistory")}:</strong>
          <ul className="mt-2 list-disc ml-5 space-y-2">
            {complaint.disputes.map((d) => (
              <li key={d.id}>
                <div>
                  <span className="font-semibold">{d.user.username}</span>: {d.explanation}
                  <br />
                  <span className="text-sm text-gray-500">{new Date(d.created_at).toLocaleString()}</span>
                </div>
                {d.evidence && (
                  <a
                    href={d.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    {t("complaint.viewEvidence")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ComplaintInfo;

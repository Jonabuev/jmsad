import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import ComplaintCard from "./list-complaints/ComplaintCard";
import { AdvancedForumFilter } from "./filter/AdvancedForumFilter";
import { useComplaints } from "@/component/hooks/forum/useForum";
import { useApi } from "@/component/hooks/useApi";

const Forum: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("popular");
  const [locationFilters, setLocationFilters] = useState({
    region: "",
    city: "",
    district: "",
    address: "",
  });
  
  const { complaints, loading, fetchComplaints } = useComplaints(filter, locationFilters);

  const { fetchData: supportComplaintApi } = useApi(
    '/support-complaint/',
    { method: 'POST' },
    { manual: true }
  );

  const { fetchData: addCommentApi } = useApi(
    '', // URL будет динамическим
    { method: 'POST' },
    { manual: true }
  );

  useEffect(() => {
    fetchComplaints();
  }, [filter, locationFilters, fetchComplaints]);

  const supportComplaint = async (complaintId: number) => {
    try {
      await supportComplaintApi({ data: { complaint_id: complaintId } });
      fetchComplaints();
    } catch (err) {
      console.error("Ошибка при поддержке жалобы:", err);
    }
  };

  const addComment = async (complaintId: number, text: string) => {
    try {
      if (!text) return;
      await addCommentApi({
        url: `/forum-add/${complaintId}/`,
        data: { text },
      });
      fetchComplaints();
    } catch (err) {
      console.error("Ошибка при добавлении комментария:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {t("forum.title")}
      </h1>
      
      <AdvancedForumFilter
        onFilterChange={setLocationFilters}
        t={t}
      />

      <div className="flex gap-2 mb-6 justify-center">
        {["popular", "new", "old"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded ${
              filter === type ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t(`forum.filter.${type}`)}
          </button>
        ))}
      </div>

      {loading && <p>{t('forum.loading')}</p>}
      {!loading && complaints.map((complaint) =>
        complaint.status === "reviewed" ? (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            onSupport={supportComplaint}
            onAddComment={addComment}
          />
        ) : null
      )}
    </div>
  );
};

export default Forum;

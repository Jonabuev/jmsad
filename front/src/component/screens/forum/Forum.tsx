import React, { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import ComplaintCard from "./list-complaints/ComplaintCard";
import { AdvancedForumFilter } from "./filter/AdvancedForumFilter";
import axios from "axios";
import { useAuthToken } from "@/component/hooks/useAuthToken";
import { useComplaints } from "@/component/hooks/forum/useForum";

const Forum: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("popular");
  const [locationFilters, setLocationFilters] = useState({
    region: "",
    city: "",
    district: "",
    address: "",
  });
  const token = useAuthToken();
  const { complaints, fetchComplaints } = useComplaints(filter, token, locationFilters);

  useEffect(() => {
    fetchComplaints();
  }, [filter, locationFilters, fetchComplaints]);

  const supportComplaint = async (complaintId: number) => {
    try {
      if (!token) return;
      await axios.post(
        "http://127.0.0.1:8000/api/support-complaint/",
        { complaint_id: complaintId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchComplaints();
    } catch (err) {
      console.error("Ошибка при поддержке жалобы:", err);
    }
  };

  const addComment = async (complaintId: number, text: string) => {
    try {
      if (!text || !token) return;
      await axios.post(
        `http://127.0.0.1:8000/api/forum-add/${complaintId}/`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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

      {complaints.map((complaint) =>
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

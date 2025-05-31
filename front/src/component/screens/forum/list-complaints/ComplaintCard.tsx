import React, { useState } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { IComplaint } from "@/component/type/users.interface";

interface ComplaintCardProps {
  complaint: IComplaint;
  onSupport: (id: number) => void;
  onAddComment: (id: number, text: string) => void;
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onSupport,
  onAddComment,
}) => {
  const { t } = useTranslation();
  const [visibleComments, setVisibleComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  return (
    <div className="border rounded p-4 mb-4 shadow-sm bg-gray-50">
      <div className="text-sm text-gray-500">
        {t("forum.postedBy")}: {complaint.complainant.username}
      </div>
      <p className="mt-2 text-gray-800">
        {t("forum.description")}: {complaint.description}
      </p>
      <p className="text-gray-700 mt-1">
        {t("forum.accused")}: {complaint.accused.username}
      </p>
      {complaint.property && (
        <p className="text-gray-700 mt-1">
          {t("forum.property")}: {complaint.property.address}
        </p>
      )}

      <div className="mt-4 flex gap-4 items-center">
        <button
          onClick={() => onSupport(complaint.id)}
          className="text-blue-600 hover:underline"
        >
          {t("forum.support")} ({complaint.support_count})
        </button>
        <button
          onClick={() => setVisibleComments((prev) => !prev)}
          className="text-gray-700 hover:underline"
        >
          {t("forum.comments")} ({complaint.comments?.length})
        </button>
      </div>

      {visibleComments && (
        <div className="mt-4 space-y-3">
          {complaint.comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-2 border p-2 rounded"
            >
              <Image
                src={
                  comment.user_data.avatar
                    ? `http://127.0.0.1:8000${comment.user_data.avatar}`
                    : "http://127.0.0.1:8000/media/avatars/def.jpg"
                }
                alt="Avatar"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <strong>{comment.user_data.username}</strong>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}

          <div className="mt-2">
            <textarea
              rows={3}
              className="w-full border p-2 rounded"
              placeholder={t("forum.addComment")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              onClick={() => {
                onAddComment(complaint.id, newComment);
                setNewComment("");
              }}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
            >
              {t("forum.send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintCard;

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { IComplaint } from "@/component/type/users.interface";

interface ComplaintCardProps {
  complaint: IComplaint;
  onSupport: (id: number) => void;
  onAddComment: (id: number, text: string) => void;
}
const getCurrentUserId = () => {
  try {
    // Проверяем, что мы на клиенте
    if (typeof window === 'undefined') return null;

    const profile = localStorage.getItem("profile");
    if (!profile) return null;

    const parsed = JSON.parse(profile);
    return parsed?.user?.id ?? null;
  } catch (e) {
    console.error("Ошибка при получении user.id из localStorage:", e);
    return null;
  }
};

const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onSupport,
  onAddComment,
}) => {
  const { t } = useTranslation();
  const [visibleComments, setVisibleComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const currentUserId = getCurrentUserId();
  const userComments = complaint.comments?.filter(
    (c) => c.user_data?.id === currentUserId
  ) ?? [];
  const hasReachedCommentLimit = userComments.length >= 2;



  useEffect(() => {
    if (visibleComments) {
      console.log('Отображение комментариев:', complaint.comments);
    }
  }, [visibleComments, complaint.comments]);

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
          {complaint.comments?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Комментариев пока нет</p>
          ) : (
            complaint.comments?.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-2 border p-2 rounded"
              >
                
                <Image
                  src={"http://127.0.0.1:8000/media/avatars/def.jpg"}
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <strong>{comment.user_data?.anonymous_name || 'Неизвестный пользователь'}</strong>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))
          )}

          <div className="mt-2">
          {hasReachedCommentLimit ? (
            <p className="text-red-600 font-semibold">
              {t("forum.commentLimitReached") || "Вы уже оставили 2 комментария к этой жалобе."}
            </p>
          ) : (
            <>
              <textarea
                rows={3}
                className="w-full border p-2 rounded"
                placeholder={t("forum.addComment")}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                onClick={() => {
                  if (!newComment.trim()) return;

                  onAddComment(complaint.id, newComment);
                  setNewComment("");
                }}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
              >
                {t("forum.send")}
              </button>
            </>
          )}
        </div>


        </div>
      )}
    </div>
  );
};

export default ComplaintCard;

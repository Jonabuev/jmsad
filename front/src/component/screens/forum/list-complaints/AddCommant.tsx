import { addForumComment } from "@/api/forumApi";

interface Props {
  complaintId: number;
  token: string | null;
  t: (key: string) => string;
  value: string;
  onChange: (val: string) => void;
  onSuccess: () => void;
}

export const AddComment = ({
  complaintId,
  token,
  t,
  value,
  onChange,
  onSuccess,
}: Props) => {
  const submitComment = async () => {
    if (!token || !value) return;
    await addForumComment(complaintId, value, token);
    onChange("");
    onSuccess();
  };

  return (
    <div>
      <textarea
        rows={3}
        className="w-full border p-2 rounded"
        placeholder={t("forum.addComment")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        onClick={submitComment}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
      >
        {t("forum.send")}
      </button>
    </div>
  );
};

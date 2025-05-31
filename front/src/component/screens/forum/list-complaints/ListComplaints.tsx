import Image from "next/image";
import { Comment } from "@/component/type/users.interface";

export const CommentList = ({ comments }: { comments: Comment[] }) => (
  <>
    {comments.map((comment) => (
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
  </>
);

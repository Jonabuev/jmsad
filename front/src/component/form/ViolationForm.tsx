// components/ViolationForm.tsx

import { useState } from "react";
import { issueViolation } from "@/api/userApi";

const reasonsList = [
  "Нарушение договора",
  "Оскорбление",
  "Фейковый аккаунт",
  "Жалобы от других арендаторов",
  "Мошенничество",
];

export default function ViolationForm({ targetUserId }: { targetUserId: number }) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      setMessage("Выберите хотя бы одну причину.");
      return;
    }

    try {
      await issueViolation(targetUserId, selectedReasons.join("; "));
      setMessage("Нарушение успешно назначено");
      setSelectedReasons([]);
    } catch (err) {
      setMessage("Ошибка при назначении нарушения");
    }
  };

  return (
    <div className="border p-4 rounded bg-white">
      <h3 className="font-bold mb-2">Назначить нарушение</h3>
      <ul className="space-y-1">
        {reasonsList.map((reason) => (
          <li key={reason}>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason)}
                onChange={() => toggleReason(reason)}
              />
              {reason}
            </label>
          </li>
        ))}
      </ul>
      <button
        onClick={handleSubmit}
        className="mt-3 bg-red-600 text-white px-4 py-1 rounded"
      >
        Назначить
      </button>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}

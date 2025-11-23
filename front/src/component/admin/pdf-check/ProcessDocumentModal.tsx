import { FC, useState, useEffect } from "react";
import { EmailDocument, ProcessDocumentFormData } from "@/types/emailDocument";
import { t } from "i18next";

interface ProcessDocumentModalProps {
  document: EmailDocument;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProcessDocumentFormData) => Promise<void>;
}

const ProcessDocumentModal: FC<ProcessDocumentModalProps> = ({
  document,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<ProcessDocumentFormData>({
    fio: "",
    birth_date: "",
    reason_ids: [],
    court_decision_score: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Автозаполнение из распарсенных данных
  useEffect(() => {
    if (document.parsed_data) {
      const accused = document.parsed_data.main_accused?.[0];
      
      // Извлекаем номер дела (первый элемент массива, очищенный от "№")
      const caseNumber = document.parsed_data.case_numbers?.[0]
        ?.replace(/^№\s?/, "")
        .trim() || "";
      
      setFormData({
        fio: accused?.fio || "",
        birth_date: document.parsed_data.birth_date || "",
        reason_ids: [],
        court_decision_score: caseNumber, // ← ВОТ ЗДЕСЬ ИСПРАВЛЕНИЕ
      });
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Ошибка при обработке");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Обработка документа
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{document.filename}</p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* ФИО */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО обвиняемого *
            </label>
            <input
              type="text"
              value={formData.fio}
              onChange={(e) =>
                setFormData({ ...formData, fio: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Иванов Иван Иванович"
            />
          </div>

          {/* Дата рождения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата рождения *
            </label>
            <input
              type="text"
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ДД.ММ.ГГГГ"
              pattern="\d{2}\.\d{2}\.\d{4}"
            />
            <p className="text-xs text-gray-500 mt-1">Формат: ДД.ММ.ГГГГ</p>
          </div>

          {/* Оценка судебного решения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Номер судебного решения
            </label>
            <input
              type="text"
              value={formData.court_decision_score}
              onChange={(e) =>
                setFormData({ ...formData, court_decision_score: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("pdfCheck.courtNumberPlaceholder")}
            />
            {/* Добавим подсказку, если данные автозаполнены */}
            {document.parsed_data?.case_numbers?.[0] && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Автоматически извлечено из документа
              </p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </>
              ) : (
                "Создать жалобу"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessDocumentModal;
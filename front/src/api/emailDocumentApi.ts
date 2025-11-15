import axios from "axios";
import { apiUrl } from "@/utils/url";
import { getCookie } from "@/utils/cookieUtils"; // Импортируйте вашу функцию getCookie

// Получить список email документов
export const fetchEmailDocuments = (params?: {
  sender?: string;
  status?: string;
}) => {
  const token = getCookie("access_token"); // Получаем токен из cookie
  
  return axios.get(apiUrl("/email-documents/"), {
    params,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};

// Обработать документ и создать жалобу
export const processEmailDocument = (
  documentId: number,
  data: {
    fio: string;
    birth_date: string;
    complaint_description: string;
    reason_ids: number[];
    court_decision_score?: number;
  }
) => {
  const token = getCookie("access_token");
  
  return axios.post(
    apiUrl(`/email-documents/${documentId}/process/`),
    data,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
};

// Запустить парсинг email вручную
export const triggerEmailParsing = (sender?: string) => {
  const token = getCookie("access_token");
  
  return axios.post(
    apiUrl("/email-documents/trigger-parsing/"),
    { sender },
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
};
export interface EmailDocument {
  id: number;
  email_id: string;
  sender: string;
  subject: string;
  received_date: string;
  filename: string;
  pdf_url: string | null;
  parsed_data: {
    case_numbers: string[];
    main_accused: Array<{
      fio: string;
      before: string;
      after: string;
    }> | null;
    birth_date: string;
    is_court_case: boolean;
  } | null;
  status: "pending" | "parsed" | "processed" | "error";
  error_message: string;
  created_at: string;
}

export interface ProcessDocumentFormData {
  fio: string;
  birth_date: string;
  reason_ids: number[];
  court_decision_score?: string;
}
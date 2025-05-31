export interface IComplaint {
  id: number;
  property_id: number;
  tenant_identifier: string;
  landlord_identifier: string;
  reason:
    | "late_payment"
    | "property_damage"
    | "contract_violation"
    | "neighbor_complaints";
  description: string;
  evidence?: string[];
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface IUser {
  id: number;
  username: string;
  anonymous_name?: string;
  email: string;
  email_confirmed: boolean;
  identifier: string;
  role: string;
  phone_number: string;
  average_rating?: number;
  avatar?: string;
  is_superuser: boolean;
  rating?: number;
  complaints_rental: IComplaint[];
  document_type: "id_card" | "passport_kz" | "visa";
  passport_expiry: string;
  visa_number?: string;
  citizenship: string;
}

export interface IRental {
  id: number;
  house: IHouse;
  tenant: IUser;
  status: 'pending' | 'active' | 'ended' | 'rejected';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  is_confirmed: boolean;
}

export interface IProfile {
  user: IUser;
  complaint_send: IComplaint[];
  complaint_recceived: IComplaint[];
  admin_complaints: IComplaint[];
}

export interface ITenant {
  complaint_reasons: string;
  court_scores: string;
  username: string;
  anonymous_name?: string;
  email: string;
  email_confirmed: boolean;
  identifier: string;
  role: string;
  phone_number: string;
  avatar?: string;
  is_superuser: boolean;
  rating?: number;
  complaints_rental: IComplaint[];
  complaint_count: number;
  r_date: Date;
  complaint_dates?: string[];
}

export interface IHouse {
  id: number;
  city: string;
  address: string;
  region: string;
  type_p: string;
  num_of_rooms: number;
}

export interface ReasonList {
  id: number;
  name: string;
}

export interface Reason {
  id: number;
  reason: string;
  complaint_id: IComplaint[];
  complaintreason_id: ReasonList[];
}

export interface IComplaint {
  id: number;
  description: string;
  status: "pending" | "reviewed" | "rejected" | "resolved";
  created_at: string;
  uuid: string;
  support_count: number;
  rating: number;
  accused: IUser;
  complainant: IUser;
  property: IHouse;
  reasons: Reason[];
  evidence: string;
  comments: Comment[];
  is_superuser: boolean;
}

export interface Comment {
  id: number;
  user: IUser;
  text: string;
  created_at: string;
  user_data: IUser;
}

export interface IProfileData {
  user: IUser;
  id: number;
  username: string;
  role: string;
  thirdname: string;
  phone_number: string;
  email: string;
  email_confirmed: boolean;
  phone_confirmed: boolean;
  type_entity: string;
  type_identify: string;
  identifier: string;
  rating: number;
  avatar: string;
  r_date: string;
  houses: IHouse[]; // <- убрал ?
  rentals: IRental[];
  complaint_received: IComplaint[];
  complaints_rental: IComplaint[];
  rentals_all: IRental[];
  complaint_send: IComplaint[];
  admin_complaints: IComplaint[];
  document_type: string;
  passport_expiry: string;
  anonymous_name : string;
  is_banned: boolean;
}

export interface IPublicProfileData {
  anonymous_name: string;
  id: number;
  username: string;
  email: string;
  email_confirmed: boolean;
  phone_number: string;
  identifier: string;
  role: "tenant" | "landlord";
  avatar: string | null;
  rating: number;
  is_banned: boolean;

  houses?: IHouse[]; // если landlord
  rentals?: IRental[]; // если tenant

  complaints_rental?: IComplaint[]; // отправленные жалобы
  complaint_received?: IComplaint[]; // полученные жалобы
}

export interface IUserShort {
  id: number;
  username: string;
  anonymous_name?: string;
  display_name?: string;
  email: string;
}

export interface IRegisterData {
  username: string;
  anonymous_name?: string;
  email: string;
  phone_number: string;
  role: "tenant" | "landlord";
  type_entity: "individual" | "legal_entity";
  type_identify: "iin" | "bin";
  identifier: string;
  document_type: "id_card" | "passport_kz" | "visa";
  passport_expiry: string;
  visa_number: string;
  password1: string;
  password2: string;
  citizenship: string;
}


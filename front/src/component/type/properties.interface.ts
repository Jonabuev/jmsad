export interface IProperty {
  id: number;
  owner_identifier: string;
  address: string;
  city: string;
  region: string;
  property_type: "house" | "apartment" | "room";
  num_of_rooms: number;
  created_at: string;
}

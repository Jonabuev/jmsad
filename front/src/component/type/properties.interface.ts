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

export interface IHouse {
    id: number;
    owner: number;
    address: string;
    street: string;
    microdistrict: string;
    district: string;
    city: string;
    region: string;
    description: string;
    area: number;
    floor: number;
    total_floors: number;
    year_built: number;
    is_furnished: boolean;
    has_balcony: boolean;
    type_p: string;
    num_of_rooms: number;
    price: string;
    created_at: string;
    comment: string;
    latitude: number;
    longitude: number;
    is_rented: boolean;
    images: string[];
}

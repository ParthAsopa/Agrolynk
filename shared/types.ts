// Recommendation Data Types
export interface SeedItem {
  name: string;
  rating: string;
  description: string;
}

export interface FertilizerItem {
  name: string;
  price: number;
  description: string;
}

export interface EquipmentItem {
  name: string;
  availability: string;
  description: string;
}

export interface Recommendation {
  seeds: SeedItem[];
  fertilizers: FertilizerItem[];
  equipment: EquipmentItem[];
}

// Market Insight Data Types
export interface ChartData {
  month: string;
  price: number;
}

export interface DemandInfo {
  status: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface AlternativeOption {
  name: string;
  valueIncrease: number;
  description: string;
}

export interface PotentialBuyer {
  name: string;
  distance: number;
  pricePerQuintal: number;
  tag: string;
  note: string;
}

export interface MarketInsight {
  currentPrice: number;
  demand: DemandInfo;
  priceHistory: ChartData[];
  alternatives: AlternativeOption[];
  potentialBuyers: PotentialBuyer[];
}

// Query Parameters
export interface BuyQueryParams {
  crop: string;
  location: string;
  farmSize: number;
}

export interface SellQueryParams {
  crop: string;
  location: string;
  quantity: number;
}

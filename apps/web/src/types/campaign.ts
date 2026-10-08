/**
 * Campaign data models and filter types for the Stellar Client OS frontend.
 */

export type CampaignStatus = "Active" | "Paused" | "Successful" | "Failed" | "Claimed";

export type WaterSourceType =
  | "Borehole"
  | "Hand-dug Well"
  | "Solar Pump"
  | "Rainwater Harvesting"
  | "Spring Protection"
  | "Sand Dam"
  | "Filtration Station"
  | "Piped Supply"
  | "Rope Pump";

export interface CampaignData {
  id: string;
  title: string;
  description: string;
  creator: string;
  token: string;
  targetAmount: string;
  minTarget: string;
  totalRaised: string;
  status: CampaignStatus;
  waterSourceType: WaterSourceType;
  costPerWaterSource: number;
  waterSourcesCompleted: number;
  targetWaterSources: number;
  createdAt: number;
  deadline: number;
  location?: string;
  imageUrl?: string;
  uniqueContributors?: number;
  contributionCount?: number;
}

export interface CampaignFilterOptions {
  searchQuery: string;
  status: CampaignStatus | "All";
  waterSourceType: WaterSourceType | "All";
  progressRange: "All" | "0-25%" | "25-50%" | "50-75%" | "75-100%" | "100%+";
  sortBy: "trending" | "newest" | "progress" | "target";
}

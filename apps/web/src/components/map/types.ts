export interface StreamLocation {
  lat: number;
  lng: number;
}

export type StreamStatus = "active" | "funded" | "pending";

export interface AzableStream {
  id: string;
  title: string;
  description: string;
  location: StreamLocation;
  amount: string;
  currency: string;
  status: StreamStatus;
  creator: string;
  category: string;
  payRate?: number;
  deadline?: string;
  altitude?: number;
}

export type JobSortOption = "pay" | "deadline" | "altitude";

export interface StreamCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  streams: AzableStream[];
}

export interface AzableMapFilters {
  status?: StreamStatus[];
  category?: string[];
  searchQuery?: string;
}

export interface AzableMapProps {
  streams: AzableStream[];
  className?: string;
  filters?: AzableMapFilters;
  onStreamSelect?: (stream: AzableStream) => void;
  onFilterChange?: (filters: AzableMapFilters) => void;
  isLoading?: boolean;
}

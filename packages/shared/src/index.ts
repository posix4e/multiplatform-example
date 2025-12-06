export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

export interface Credential {
  id: string;
  domain: string;
  username: string;
}

export const APP_NAME = "Multiplatform Example";
export const API_VERSION = "v1";

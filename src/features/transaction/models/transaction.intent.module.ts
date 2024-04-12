export interface IntentPayload {
  id: string;
  title: string;
  details?: string;
  assets: number;
  cost: { value: number; currency: string; }
}
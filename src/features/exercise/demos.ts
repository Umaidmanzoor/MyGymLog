import manifest from "../../data/demos.json";
export interface Demonstration {
  sourceName: string;
  kind: "photo-steps" | "original-guide";
  images: string[];
  video: string;
  muscles: string[];
  steps: string[];
  sourceURL: string;
}
export const demonstrations = manifest as Record<string, Demonstration>;
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const demonstration = (id: string) => demonstrations[id];

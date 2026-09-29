import { useLiveQuery } from "dexie-react-hooks";
import { setting } from "../db/schema";
export function useAppName() {
  const name = useLiveQuery(() => setting("appName", "MyGymLog"));
  return name?.trim() || "MyGymLog";
}

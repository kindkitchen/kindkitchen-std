import { make_fail } from "@kindkitchen/internal-util/make-fail";

export const GAuthErr = make_fail<{
  message: string;
  cause?: unknown;
  expected?: string;
  actual?: string;
  details?: string;
}>("GAuthErr");
export type GAuthErr = InstanceType<typeof GAuthErr>;

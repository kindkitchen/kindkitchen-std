import { make_fail } from "@kindkitchen/internal-util/make-fail";

export const InvalidCallbackCodeError = make_fail<{ cause: unknown }>(
  "InvalidCallbackCodeError",
);
export type InvalidCallbackCodeError = InstanceType<
  typeof InvalidCallbackCodeError
>;

export const TokenExchangeError = make_fail<{ cause: unknown }>(
  "TokenExchangeError",
);
export type TokenExchangeError = InstanceType<typeof TokenExchangeError>;

export const MissingIdTokenError = make_fail("MissingIdTokenError");
export type MissingIdTokenError = InstanceType<typeof MissingIdTokenError>;

export const VerifyIdTokenError = make_fail<{ cause: unknown }>(
  "VerifyIdTokenError",
);
export type VerifyIdTokenError = InstanceType<typeof VerifyIdTokenError>;

export const MissingPayloadError = make_fail("MissingPayloadError");
export type MissingPayloadError = InstanceType<typeof MissingPayloadError>;

export type ProcessCallbackPayloadError =
  | InvalidCallbackCodeError
  | TokenExchangeError
  | MissingIdTokenError
  | VerifyIdTokenError
  | MissingPayloadError;

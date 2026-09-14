export class AuthConfigurationError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("Authentication is not configured for this operation");
    this.name = "AuthConfigurationError";
    this.code = code;
  }
}

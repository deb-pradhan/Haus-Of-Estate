export class LeadValidationError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "LeadValidationError";
  }
}

export class LeadOriginError extends Error {
  constructor() {
    super("Origin is not allowed");
    this.name = "LeadOriginError";
  }
}

export class LeadConflictError extends Error {
  constructor() {
    super("Submission ID has already been used");
    this.name = "LeadConflictError";
  }
}

export class LeadRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many submissions");
    this.name = "LeadRateLimitError";
  }
}

export class LeadInfrastructureError extends Error {
  constructor(message = "Lead intake is temporarily unavailable") {
    super(message);
    this.name = "LeadInfrastructureError";
  }
}

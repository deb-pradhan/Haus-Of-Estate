export class LeadDeliveryError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(code);
    this.name = "LeadDeliveryError";
  }
}

export function classifyDeliveryError(error: unknown): LeadDeliveryError {
  if (error instanceof LeadDeliveryError) return error;
  return new LeadDeliveryError("DELIVERY_UNEXPECTED", true);
}

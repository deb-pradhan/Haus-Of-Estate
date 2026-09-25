export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured");
    this.name = "DatabaseUnavailableError";
  }
}

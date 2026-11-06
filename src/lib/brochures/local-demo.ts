/** Only a deliberately started development server may expose the simulated journey. */
export function isBrochureDemoEnabled(environment = process.env) {
  return environment.NODE_ENV === 'development' &&
    environment.HAUS_BROCHURE_DEMO_ENABLED === 'true'
}

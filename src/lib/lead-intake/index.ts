export {
  LEAD_FORM_VERSION,
  MARKETING_CONSENT_WORDING,
  PRIVACY_NOTICE_VERSION,
  leadIntakeV2Schema,
  type LeadIntakeV2Input,
} from "./contract";
export { normalizeLeadRequest, type NormalizedLeadIntake } from "./normalize";
export { recordNewsletterWithdrawal } from "./newsletter";

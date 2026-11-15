// Company and ICO details verified against their official registers on 25 September 2026.

/**
 * Registrations the business has not yet confirmed. Every field is empty on
 * purpose: a line is shown only when its value is filled in, so nothing is
 * stated until it can be evidenced. Never invent a value here; the open
 * questions are listed in docs/questions-for-sonia.md.
 */
const REGULATORY: {
  /** HMRC anti-money-laundering supervision registration (estate agency business). */
  hmrcAmlRegistration: string;
  /** Redress scheme name, e.g. "The Property Ombudsman" or "Property Redress Scheme". */
  redressScheme: string;
  /** Membership number with the redress scheme above. */
  redressMembershipNo: string;
  /** Client money protection scheme, only if client money is ever held. */
  cmpScheme: string;
  /** Rent Smart Wales registration or licence, only for Welsh lettings activity. */
  rentSmartWales: string;
  /** Dubai brokerage ORN of the contracting UAE broker. */
  dubaiOrn: string;
  /** VAT registration number, if registered. */
  vatNumber: string;
  /** A dedicated mailbox for accessibility feedback. Empty falls back to the general email. */
  accessibilityContactEmail: string;
} = {
  hmrcAmlRegistration: "",
  redressScheme: "",
  redressMembershipNo: "",
  cmpScheme: "",
  rentSmartWales: "",
  dubaiOrn: "",
  vatNumber: "",
  accessibilityContactEmail: "",
};

export const COMPANY_IDENTITY = {
  name: "Haus of Estate",
  legalName: "HAUS OF ESTATE LTD",
  number: "17188168",
  companiesHouseUrl: "https://find-and-update.company-information.service.gov.uk/company/17188168",
  registeredJurisdiction: "England and Wales",
  registeredOffice: "Haus Of Estate, 115 City Road, Unit 1, Cardiff, South Glamorgan, United Kingdom, CF24 3BP",
  icoRegistrationNumber: "ZC254915",
  icoRegisterUrl: "https://ico.org.uk/ESDWebPages/Entry/ZC254915",
  generalEmail: "info@hausofestate.com",
  ...REGULATORY,
} as const;

export interface RegulatoryLine {
  label: string;
  value: string;
}

/**
 * Regulatory lines to display, in order. A line is returned only when its
 * value has been supplied, so an unconfigured site shows none.
 */
export function getRegulatoryLines(identity: Record<string, string> = COMPANY_IDENTITY): RegulatoryLine[] {
  const lines: RegulatoryLine[] = [];
  const add = (label: string, value: string | undefined) => {
    const trimmed = value?.trim();
    if (trimmed) lines.push({ label, value: trimmed });
  };

  add("HMRC anti-money-laundering supervision", identity.hmrcAmlRegistration);
  if (identity.redressScheme?.trim()) {
    add(
      "Redress scheme",
      identity.redressMembershipNo?.trim()
        ? `${identity.redressScheme.trim()}, membership ${identity.redressMembershipNo.trim()}`
        : identity.redressScheme,
    );
  }
  add("Client money protection", identity.cmpScheme);
  add("Rent Smart Wales", identity.rentSmartWales);
  add("Dubai brokerage ORN", identity.dubaiOrn);
  add("VAT number", identity.vatNumber);
  return lines;
}

/** Email for accessibility feedback; falls back to the general company email. */
export function getAccessibilityEmail(): string {
  return COMPANY_IDENTITY.accessibilityContactEmail.trim() || COMPANY_IDENTITY.generalEmail;
}

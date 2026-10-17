// Company and ICO details verified against their official registers on 25 September 2026.

/**
 * FOUNDER PLACEHOLDERS. Every field below is empty on purpose: the UI renders a
 * regulatory line only when its value is a non-empty string, so nothing is
 * claimed until the founder supplies (and can evidence) it. Never invent a
 * value here. See docs/mega-upgrade/audits/legal.md, "Founder placeholders".
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
  /** Dubai brokerage ORN of the contracting UAE broker (not Haus of Estate unless it holds one). */
  dubaiOrn: string;
  /** One plain-English line on what the professional indemnity policy covers. */
  piInsuranceNote: string;
  /** VAT registration number, if registered. */
  vatNumber: string;
  /** Dedicated mailboxes. Empty falls back to the general company email. */
  complaintsContactEmail: string;
  accessibilityContactEmail: string;
} = {
  hmrcAmlRegistration: "",
  redressScheme: "",
  redressMembershipNo: "",
  cmpScheme: "",
  rentSmartWales: "",
  dubaiOrn: "",
  piInsuranceNote: "",
  vatNumber: "",
  complaintsContactEmail: "",
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
 * founder-supplied value is non-empty, so an unconfigured site shows none.
 */
export function getRegulatoryLines(): RegulatoryLine[] {
  const c: Record<string, string> = COMPANY_IDENTITY;
  const lines: RegulatoryLine[] = [];
  const add = (label: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) lines.push({ label, value: v });
  };

  add("HMRC anti-money-laundering supervision", c.hmrcAmlRegistration);
  if (c.redressScheme?.trim()) {
    add(
      "Redress scheme",
      c.redressMembershipNo?.trim()
        ? `${c.redressScheme.trim()}, membership ${c.redressMembershipNo.trim()}`
        : c.redressScheme,
    );
  }
  add("Client money protection", c.cmpScheme);
  add("Rent Smart Wales", c.rentSmartWales);
  add("Dubai brokerage ORN", c.dubaiOrn);
  add("Professional indemnity insurance", c.piInsuranceNote);
  add("VAT number", c.vatNumber);
  return lines;
}

/** Email for complaints; falls back to the general company email. */
export function getComplaintsEmail(): string {
  return COMPANY_IDENTITY.complaintsContactEmail.trim() || COMPANY_IDENTITY.generalEmail;
}

/** Email for accessibility feedback; falls back to the general company email. */
export function getAccessibilityEmail(): string {
  return COMPANY_IDENTITY.accessibilityContactEmail.trim() || COMPANY_IDENTITY.generalEmail;
}

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnquiryForm } from "@/components/lead-eoi/enquiry-form";

describe("interiors enquiry form", () => {
  it("prefills the chosen goal and room while budget, property type and consent remain unselected", () => {
    const html = renderToStaticMarkup(<EnquiryForm interiors={{ goal: "lighting", room: "bedroom" }} />);
    expect(html).toContain('value="lighting" selected=""');
    expect(html).toContain('value="bedroom" selected=""');
    expect(html).toContain('<option value="" selected="">Select if known</option>');
    expect(html).toMatch(/<input[^>]*id="[^"]*-interiorBudget"[^>]*value=""/);
    expect(html).not.toContain('checked=""');
    expect(html).toContain("Your own budget guide, not a quote");
    expect(html).toContain('maxLength="1500"');
  });

  it("keeps the ordinary enquiry form free of project-specific fields", () => {
    const html = renderToStaticMarkup(<EnquiryForm />);
    expect(html).not.toContain("Approximate budget");
    expect(html).not.toContain("Your project brief");
    expect(html).toContain("What would you like to know?");
  });
});

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeadModalProvider } from "@/components/lead-modal";
import { PropertyAssistantProvider } from "@/components/property-assistant/property-assistant-provider";
import { isPropertyAssistantEnabled } from "@/lib/features";
import { draftMode } from "next/headers";
import { isSanityLivePreviewConfigured, SanityLive } from "@/sanity/live";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftModeEnabled } = await draftMode();
  const leadIntakeEnabled = process.env.LEAD_INTAKE_ENABLED === "true";
  const assistantEnabled = isPropertyAssistantEnabled();
  const content = (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );

  return (
    <LeadModalProvider leadIntakeEnabled={leadIntakeEnabled}>
      {assistantEnabled ? (
        <PropertyAssistantProvider enabled>{content}</PropertyAssistantProvider>
      ) : (
        content
      )}
      <SanityLive
        includeDrafts={isDraftModeEnabled && isSanityLivePreviewConfigured}
      />
    </LeadModalProvider>
  );
}

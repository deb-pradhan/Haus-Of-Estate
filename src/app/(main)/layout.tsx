import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeadModalProvider } from "@/components/lead-modal";
import { PropertyAssistantProvider } from "@/components/property-assistant/property-assistant-provider";
import { isAuthEnabled, isPropertyAssistantEnabled } from "@/lib/features";
import { getCareersInbox } from "@/lib/careers-settings";
import { isLeadIntakeReady } from "@/lib/lead-intake/security";
import { draftMode } from "next/headers";
import { isSanityLivePreviewConfigured, SanityLive } from "@/sanity/live";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isEnabled: isDraftModeEnabled } = await draftMode();
  const leadIntakeEnabled = isLeadIntakeReady();
  const assistantEnabled = isPropertyAssistantEnabled();
  const content = (
    <div className="flex min-h-screen flex-col">
      <Header authEnabled={isAuthEnabled()} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer careersEmail={getCareersInbox()} />
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

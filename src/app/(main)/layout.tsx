import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeadModalProvider } from "@/components/lead-modal";
import { PropertyAssistantProvider } from "@/components/property-assistant/property-assistant-provider";
import { isPropertyAssistantEnabled } from "@/lib/features";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <LeadModalProvider>
      {assistantEnabled ? (
        <PropertyAssistantProvider enabled>{content}</PropertyAssistantProvider>
      ) : (
        content
      )}
    </LeadModalProvider>
  );
}

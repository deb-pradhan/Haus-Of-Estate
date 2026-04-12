import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LeadModalProvider } from "@/components/lead-modal";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LeadModalProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </LeadModalProvider>
  );
}

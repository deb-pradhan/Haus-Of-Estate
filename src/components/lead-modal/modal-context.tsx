"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  LeadEoiProvider,
  useLeadEoi,
} from "@/components/lead-eoi/lead-eoi-controller";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { trackAnalytics } from "@/lib/analytics";
import type { BuyerInitialBrief } from "./buyer-modal";

const AccountModal = dynamic(() => import("./account-modal").then((module) => module.AccountModal));
const BuyerModal = dynamic(() => import("./buyer-modal").then((module) => module.BuyerModal));
const SellerModal = dynamic(() => import("./seller-modal").then((module) => module.SellerModal));

const COUNTRY_LABELS: Record<
  NonNullable<BuyerInitialBrief["market"]>,
  string
> = {
  dubai: "United Arab Emirates",
  uk: "United Kingdom",
  bali: "Indonesia",
};

const AREA_LABELS: Partial<
  Record<NonNullable<BuyerInitialBrief["area"]>, string>
> = {
  marina: "Dubai Marina",
  downtown: "Downtown Dubai",
  palm: "Palm Jumeirah",
  jbr: "JBR",
  business_bay: "Business Bay",
  london: "London",
  manchester: "Manchester",
  birmingham: "Birmingham",
  liverpool: "Liverpool",
  edinburgh: "Edinburgh",
  canggu: "Canggu",
  seminyak: "Seminyak",
  ubud: "Ubud",
  uluwatu: "Uluwatu",
  sanur: "Sanur",
};

function initialPreferencesFromBuyerBrief(brief?: BuyerInitialBrief) {
  if (!brief) return undefined;
  return {
    market: brief.market ? COUNTRY_LABELS[brief.market] : undefined,
    location: brief.area ? AREA_LABELS[brief.area] : undefined,
    bedrooms: brief.bedrooms,
  };
}

interface ModalContextValue {
  openAccount: () => void;
  openBuyer: () => void;
  openBuyerWithBrief: (brief?: BuyerInitialBrief) => void;
  openSeller: () => void;
  openNewsletter: (email?: string) => void;
}

const ModalContext = createContext<ModalContextValue>({
  openAccount: () => {},
  openBuyer: () => {},
  openBuyerWithBrief: () => {},
  openSeller: () => {},
  openNewsletter: () => {},
});

export function useLeadModals() {
  return useContext(ModalContext);
}

export function LegacyLeadModalProvider({ children }: { children: ReactNode }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [buyerBrief, setBuyerBrief] = useState<BuyerInitialBrief>();
  const [buyerSession, setBuyerSession] = useState(0);
  const [sellerOpen, setSellerOpen] = useState(false);

  useEffect(() => {
    function closeForAssistant(event: Event) {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if (!detail?.open) return;
      setAccountOpen(false);
      setBuyerOpen(false);
      setSellerOpen(false);
    }
    window.addEventListener("haus:property-assistant-state", closeForAssistant);
    return () => {
      window.removeEventListener(
        "haus:property-assistant-state",
        closeForAssistant,
      );
    };
  }, []);

  function notifyLeadModalOpen() {
    trackAnalytics("haus_contact_click", { contact_method: "enquiry" });
    window.dispatchEvent(new CustomEvent("haus:lead-modal-open"));
  }

  function openBuyerWithBrief(brief?: BuyerInitialBrief) {
    notifyLeadModalOpen();
    setBuyerBrief(brief);
    setBuyerSession((current) => current + 1);
    setBuyerOpen(true);
  }

  return (
    <ModalContext.Provider
      value={{
        openAccount: () => {
          notifyLeadModalOpen();
          setAccountOpen(true);
        },
        openBuyer: () => openBuyerWithBrief(),
        openBuyerWithBrief,
        openSeller: () => {
          notifyLeadModalOpen();
          setSellerOpen(true);
        },
        openNewsletter: () => {
          notifyLeadModalOpen();
          setAccountOpen(true);
        },
      }}
    >
      {children}
      {accountOpen && <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />}
      {buyerOpen && <BuyerModal
        key={buyerSession}
        open={buyerOpen}
        onOpenChange={(open) => {
          setBuyerOpen(open);
          if (!open) setBuyerBrief(undefined);
        }}
        initialBrief={buyerBrief}
      />}
      {sellerOpen && <SellerModal open={sellerOpen} onOpenChange={setSellerOpen} />}
    </ModalContext.Provider>
  );
}

function LeadEoiCompatibilityProvider({ children }: { children: ReactNode }) {
  const { openLead } = useLeadEoi();

  return (
    <ModalContext.Provider
      value={{
        openAccount: () => openLead({ surface: "manual_cta" }),
        openBuyer: () =>
          openLead({ interest: "buy", surface: "manual_cta" }),
        openBuyerWithBrief: (brief) =>
          openLead({
            interest: brief?.intent,
            initialPreferences: initialPreferencesFromBuyerBrief(brief),
            surface: "manual_cta",
          }),
        openSeller: () =>
          openLead({ interest: "sell_let", surface: "manual_cta" }),
        openNewsletter: (email) =>
          openLead({
            interest: "newsletter_only",
            email,
            surface: "newsletter",
          }),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function LeadModalProvider({
  children,
  leadIntakeEnabled = false,
}: {
  children: ReactNode;
  leadIntakeEnabled?: boolean;
}) {
  if (!leadIntakeEnabled) {
    return <UnavailableLeadModalProvider>{children}</UnavailableLeadModalProvider>;
  }

  return (
    <LeadEoiProvider>
      <LeadEoiCompatibilityProvider>{children}</LeadEoiCompatibilityProvider>
    </LeadEoiProvider>
  );
}

// A disabled intake must not revive older forms that bypass the release gate.
function UnavailableLeadModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const contact = () => router.push("/enquire");
  return <ModalContext.Provider value={{ openAccount: contact, openBuyer: contact, openBuyerWithBrief: contact, openSeller: contact, openNewsletter: contact }}>{children}</ModalContext.Provider>;
}

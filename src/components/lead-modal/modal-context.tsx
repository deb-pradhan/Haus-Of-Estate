"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  LeadEoiProvider,
  useLeadEoi,
} from "@/components/lead-eoi/lead-eoi-controller";
import { AccountModal } from "./account-modal";
import { BuyerModal } from "./buyer-modal";
import { SellerModal } from "./seller-modal";

interface ModalContextValue {
  openAccount: () => void;
  openBuyer: () => void;
  openSeller: () => void;
  openNewsletter: (email?: string) => void;
}

const ModalContext = createContext<ModalContextValue>({
  openAccount: () => {},
  openBuyer: () => {},
  openSeller: () => {},
  openNewsletter: () => {},
});

export function useLeadModals() {
  return useContext(ModalContext);
}

function LegacyLeadModalProvider({ children }: { children: ReactNode }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        openAccount: () => setAccountOpen(true),
        openBuyer: () => setBuyerOpen(true),
        openSeller: () => setSellerOpen(true),
        openNewsletter: () => setAccountOpen(true),
      }}
    >
      {children}
      <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
      <BuyerModal open={buyerOpen} onOpenChange={setBuyerOpen} />
      <SellerModal open={sellerOpen} onOpenChange={setSellerOpen} />
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
    return <LegacyLeadModalProvider>{children}</LegacyLeadModalProvider>;
  }

  return (
    <LeadEoiProvider>
      <LeadEoiCompatibilityProvider>{children}</LeadEoiCompatibilityProvider>
    </LeadEoiProvider>
  );
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import dynamic from "next/dynamic";
import { trackAnalytics } from "@/lib/analytics";

const AccountModal = dynamic(() =>
  import("./account-modal").then((module) => module.AccountModal),
);
const BuyerModal = dynamic(() =>
  import("./buyer-modal").then((module) => module.BuyerModal),
);
const SellerModal = dynamic(() =>
  import("./seller-modal").then((module) => module.SellerModal),
);

interface ModalContextValue {
  openAccount: () => void;
  openBuyer: () => void;
  openSeller: () => void;
}

const ModalContext = createContext<ModalContextValue>({
  openAccount: () => {},
  openBuyer: () => {},
  openSeller: () => {},
});

export function useLeadModals() {
  return useContext(ModalContext);
}

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [buyerOpen, setBuyerOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);

  return (
    <ModalContext.Provider
      value={{
        openAccount: () => setAccountOpen(true),
        openBuyer: () => { trackAnalytics("haus_contact_click", { contact_method: "enquiry" }); setBuyerOpen(true); },
        openSeller: () => { trackAnalytics("haus_contact_click", { contact_method: "enquiry" }); setSellerOpen(true); },
      }}
    >
      {children}
      {accountOpen && (
        <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
      )}
      {buyerOpen && <BuyerModal open={buyerOpen} onOpenChange={setBuyerOpen} />}
      {sellerOpen && (
        <SellerModal open={sellerOpen} onOpenChange={setSellerOpen} />
      )}
    </ModalContext.Provider>
  );
}

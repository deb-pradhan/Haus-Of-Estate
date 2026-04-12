"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AccountModal, BuyerModal, SellerModal } from "@/components/lead-modal";

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
        openBuyer: () => setBuyerOpen(true),
        openSeller: () => setSellerOpen(true),
      }}
    >
      {children}
      <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
      <BuyerModal open={buyerOpen} onOpenChange={setBuyerOpen} />
      <SellerModal open={sellerOpen} onOpenChange={setSellerOpen} />
    </ModalContext.Provider>
  );
}

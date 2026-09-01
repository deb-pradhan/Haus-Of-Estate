"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AccountModal } from "./account-modal";
import { BuyerModal, type BuyerInitialBrief } from "./buyer-modal";
import { SellerModal } from "./seller-modal";

interface ModalContextValue {
  openAccount: () => void;
  openBuyer: () => void;
  openBuyerWithBrief: (brief?: BuyerInitialBrief) => void;
  openSeller: () => void;
}

const ModalContext = createContext<ModalContextValue>({
  openAccount: () => {},
  openBuyer: () => {},
  openBuyerWithBrief: () => {},
  openSeller: () => {},
});

export function useLeadModals() {
  return useContext(ModalContext);
}

export function LeadModalProvider({ children }: { children: ReactNode }) {
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
      }}
    >
      {children}
      <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
      <BuyerModal
        key={buyerSession}
        open={buyerOpen}
        onOpenChange={(open) => {
          setBuyerOpen(open);
          if (!open) setBuyerBrief(undefined);
        }}
        initialBrief={buyerBrief}
      />
      <SellerModal open={sellerOpen} onOpenChange={setSellerOpen} />
    </ModalContext.Provider>
  );
}

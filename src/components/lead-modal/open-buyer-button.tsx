"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useLeadModals } from "./modal-context";

type OpenBuyerButtonProps = Omit<ComponentProps<typeof Button>, "onClick">;

export function OpenBuyerButton(props: OpenBuyerButtonProps) {
  const { openBuyer } = useLeadModals();

  return <Button {...props} onClick={openBuyer} />;
}

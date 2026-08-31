"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadEoiForm } from "./lead-eoi-form";
import type { LeadFormRequest } from "./types";

export function LeadEoiModal({
  request,
  onClose,
}: {
  request: LeadFormRequest;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-lg bg-surface p-5 sm:max-w-2xl sm:p-7">
        <DialogHeader className="sr-only">
          <DialogTitle>Register your interest with Haus of Estate</DialogTitle>
          <DialogDescription>
            A three-step property enquiry with separate, optional property-match
            and newsletter email choices.
          </DialogDescription>
        </DialogHeader>
        <LeadEoiForm
          surface={request.surface}
          initialInterest={request.interest}
          initialEmail={request.email}
          project={request.project}
          modal
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

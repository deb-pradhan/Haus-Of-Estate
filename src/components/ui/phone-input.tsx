"use client";

import * as React from "react";
import PhoneInputBase, { type Country } from "react-phone-number-input";
import { isValidPhoneNumber } from "libphonenumber-js";
import "react-phone-number-input/style.css";

import { cn } from "@/lib/utils";

export interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: Country;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  invalid?: boolean;
  autoComplete?: string;
}

/**
 * Shared phone input with flag + searchable country picker.
 * Emits an E.164 string (e.g. "+971585607033") via onChange.
 */
export function PhoneInput({
  id,
  value,
  onChange,
  defaultCountry = "AE",
  placeholder = "Mobile / WhatsApp number",
  disabled,
  className,
  invalid,
  autoComplete = "tel",
}: PhoneInputProps) {
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        "hoe-phone-input flex h-11 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-base shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 md:text-sm",
        invalid && "border-destructive ring-destructive/20",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
    >
      <PhoneInputBase
        id={id}
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
        defaultCountry={defaultCountry}
        international
        countryCallingCodeEditable={false}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        numberInputProps={{
          className:
            "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none border-0 py-1 pl-1 text-base md:text-sm",
        }}
      />
    </div>
  );
}

export function isValidMobile(value: string): boolean {
  if (!value) return false;
  try {
    return isValidPhoneNumber(value);
  } catch {
    return false;
  }
}

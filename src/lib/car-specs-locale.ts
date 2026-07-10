import { pickLocaleText } from "@/lib/locale-text";

type SpecTextFields = {
  engineAr?: string | null;
  engineFr?: string | null;
  dimensionsAr?: string | null;
  dimensionsFr?: string | null;
  safetyAr?: string | null;
  safetyFr?: string | null;
  comfortAr?: string | null;
  comfortFr?: string | null;
  partsAvailabilityAr?: string | null;
  partsAvailabilityFr?: string | null;
  warrantyAr?: string | null;
  warrantyFr?: string | null;
};

export function carSpecEngine(spec: SpecTextFields | null | undefined, locale: string): string {
  return pickLocaleText(locale, spec?.engineAr, spec?.engineFr);
}

export function carSpecDimensions(spec: SpecTextFields | null | undefined, locale: string): string {
  return pickLocaleText(locale, spec?.dimensionsAr, spec?.dimensionsFr);
}

export function carSpecSafety(spec: SpecTextFields | null | undefined, locale: string): string {
  return pickLocaleText(locale, spec?.safetyAr, spec?.safetyFr);
}

export function carSpecComfort(spec: SpecTextFields | null | undefined, locale: string): string {
  return pickLocaleText(locale, spec?.comfortAr, spec?.comfortFr);
}

export function carSpecPartsAvailability(spec: SpecTextFields | null | undefined, locale: string): string {
  return pickLocaleText(locale, spec?.partsAvailabilityAr, spec?.partsAvailabilityFr);
}

export function carSpecWarranty(spec: SpecTextFields | null | undefined, locale: string): string {
  return pickLocaleText(locale, spec?.warrantyAr, spec?.warrantyFr);
}

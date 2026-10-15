import type { BodyType, ConditionType, FuelType, Transmission, UsageType } from "@prisma/client";

type T = (key: string) => string;

/** Clés du namespace `catalog`. */
export function fuelLabel(t: T, fuel: FuelType): string {
  switch (fuel) {
    case "PETROL":
      return t("brandFuelPETROL");
    case "DIESEL":
      return t("brandFuelDIESEL");
    case "HYBRID":
      return t("brandFuelHYBRID");
    case "ELECTRIC":
      return t("brandFuelELECTRIC");
    default: {
      const never: never = fuel;
      return never;
    }
  }
}

/** Clés du namespace `catalog`. */
export function bodyLabel(t: T, body: BodyType): string {
  switch (body) {
    case "CITY_CAR":
      return t("brandBodyCITY_CAR");
    case "SEDAN":
      return t("brandBodySEDAN");
    case "SUV":
      return t("brandBodySUV");
    case "COMMERCIAL":
      return t("brandBodyCOMMERCIAL");
    case "PICKUP":
      return t("brandBodyPICKUP");
    case "FAMILY":
      return t("brandBodyFAMILY");
    default: {
      const never: never = body;
      return never;
    }
  }
}

/** Clés du namespace `catalog`. */
export function gearboxLabel(t: T, tx: Transmission): string {
  switch (tx) {
    case "AUTOMATIC":
      return t("txAuto");
    case "MANUAL":
      return t("txManual");
    default: {
      const never: never = tx;
      return never;
    }
  }
}

/** Clés du namespace `ui`. */
export function conditionLabel(t: T, c: ConditionType): string {
  switch (c) {
    case "NEW":
      return t("conditionNEW");
    case "USED":
      return t("conditionUSED");
    default: {
      const never: never = c;
      return never;
    }
  }
}

/** Clés du namespace `ui`. */
export function usageLabel(t: T, u: UsageType): string {
  switch (u) {
    case "CITY":
      return t("usageCITY");
    case "FAMILY":
      return t("usageFAMILY");
    case "TAXI":
      return t("usageTAXI");
    case "PROFESSIONAL":
      return t("usagePROFESSIONAL");
    case "LONG_TRIP":
      return t("usageLONG_TRIP");
    case "STUDENT":
      return t("usageSTUDENT");
    default: {
      const never: never = u;
      return never;
    }
  }
}

export const FUEL_VALUES: FuelType[] = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"];
export const BODY_VALUES: BodyType[] = ["SUV", "CITY_CAR", "SEDAN", "FAMILY", "PICKUP", "COMMERCIAL"];
export const GEARBOX_VALUES: Transmission[] = ["AUTOMATIC", "MANUAL"];
export const CONDITION_VALUES: ConditionType[] = ["NEW", "USED"];
export const USAGE_VALUES: UsageType[] = ["CITY", "FAMILY", "TAXI", "PROFESSIONAL", "LONG_TRIP", "STUDENT"];

/** Tranches de budget (DH) proposées dans les filtres. */
export const PRICE_RANGES: { min: number | null; max: number | null }[] = [
  { min: null, max: 150000 },
  { min: 150000, max: 250000 },
  { min: 250000, max: 400000 },
  { min: 400000, max: 600000 },
  { min: 600000, max: 1000000 },
  { min: 1000000, max: null },
];

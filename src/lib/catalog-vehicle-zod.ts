import { z } from "zod";
import { BodyType, ConditionType, FuelType, Transmission, UsageType } from "@prisma/client";
import { ficheEquipementBlockSchema } from "./car-fiche-equipment";
import { productStorySchema } from "./car-product-story";

export const carSpecsInputSchema = z
  .object({
    engineAr: z.string().optional(),
    engineFr: z.string().optional(),
    fiscalPower: z.number().int().optional(),
    realPowerKw: z.number().optional(),
    consumptionL100: z.number().optional(),
    dimensionsAr: z.string().optional(),
    dimensionsFr: z.string().optional(),
    seats: z.number().int().optional(),
    trunkL: z.number().int().optional(),
    safetyAr: z.string().optional(),
    safetyFr: z.string().optional(),
    comfortAr: z.string().optional(),
    comfortFr: z.string().optional(),
    warrantyAr: z.string().optional(),
    warrantyFr: z.string().optional(),
    maintenanceCostEst: z.number().int().optional(),
    partsAvailabilityAr: z.string().optional(),
    partsAvailabilityFr: z.string().optional(),
    reliabilityScore: z.number().int().min(0).max(100).optional(),
    resaleScore: z.number().int().min(0).max(100).optional(),
    comfortScore: z.number().int().min(0).max(100).optional(),
    globalScore: z.number().int().min(0).max(100).optional(),
    co2Gkm: z.number().int().min(0).optional(),
    torqueNm: z.number().int().min(0).optional(),
    groundClearanceMm: z.number().int().min(0).optional(),
    ficheEquipement: ficheEquipementBlockSchema.optional(),
    productStory: productStorySchema.optional(),
    viewer3dExteriorUrl: z.string().url().optional(),
    viewer3dInteriorUrl: z.string().url().optional(),
  })
  .optional();

export const catalogReviewSchema = z.object({
  displayLabel: z.string().min(1),
  displayLabelFr: z.string().optional().nullable(),
  city: z.string().min(1),
  commentAr: z.string().min(1),
  commentFr: z.string().optional().nullable(),
  consumptionNote: z.number().int().min(1).max(5).optional(),
  comfortNote: z.number().int().min(1).max(5).optional(),
  reliabilityNote: z.number().int().min(1).max(5).optional(),
  maintenanceNote: z.number().int().min(1).max(5).optional(),
  resaleNote: z.number().int().min(1).max(5).optional(),
  globalNote: z.number().int().min(1).max(5).optional(),
  mileageKm: z.number().int().optional(),
  usageMonths: z.number().int().optional(),
  sourceName: z.string().max(120).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

export const vehicleInputSchema = z.object({
  brandAr: z.string().min(1),
  brandFr: z.string().optional(),
  modelAr: z.string().min(1),
  modelFr: z.string().optional(),
  versionAr: z.string().min(1),
  versionFr: z.string().optional(),
  year: z.number().int().min(1990).max(2035),
  priceNewEst: z.number().int().positive(),
  priceUsedEst: z.number().int().positive().optional().nullable(),
  conditionDefault: z.nativeEnum(ConditionType),
  fuel: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(Transmission),
  bodyType: z.nativeEnum(BodyType),
  usageRecommended: z.array(z.nativeEnum(UsageType)).default([]),
  imageUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string().url()).max(20).optional(),
  brandLogoUrl: z.string().url().optional().nullable(),
  officialUrl: z.string().url().optional().nullable(),
  highlightsAr: z.string().max(12000).optional().nullable(),
  highlightsFr: z.string().max(12000).optional().nullable(),
  exteriorColorFr: z.string().max(120).optional().nullable(),
  exteriorColorAr: z.string().max(120).optional().nullable(),
  descriptionAr: z.string().min(1),
  descriptionFr: z.string().optional().nullable(),
  specs: carSpecsInputSchema,
});

export const catalogVehicleSchema = vehicleInputSchema.extend({
  reviews: z.array(catalogReviewSchema).max(10).optional(),
});

export const catalogBundleSchema = z.object({
  version: z.string().optional(),
  source: z.string().optional(),
  note: z.string().optional(),
  vehicles: z.array(catalogVehicleSchema),
});

export type VehicleInput = z.infer<typeof vehicleInputSchema>;
export type CatalogVehicleInput = z.infer<typeof catalogVehicleSchema>;
export type CatalogReviewInput = z.infer<typeof catalogReviewSchema>;

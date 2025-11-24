/**
 * Pricing Types
 * Type definitions for pricing-related data structures
 */

export interface PricingPlan {
  drillPack?: {
    priceId: string;
    price: string;
    currency: string;
    productId?: string;
  } | null;
  subscription?: {
    priceId: string;
    price: string;
    currency: string;
    interval?: string;
    productId?: string;
  } | null;
}

export interface CheckoutRequest {
  provider: string;
  priceId?: string;
  recommendationId?: string;
  skillId?: string;
  assessmentId?: string;
  metadata?: Record<string, unknown>;
}


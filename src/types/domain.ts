import type {
  CategoryRow,
  CustomerBenefitRow,
  CustomerBenefitStatus,
  CustomerRow,
  CustomerWithBirthdayRow,
  OrderItemSnapshot,
  OrderRow,
  OrderStatus,
  ProductImageRow,
  ProductRow,
  SeasonalCampaignRow,
  StoreSettingsRow,
  WhatsAppMessageLogRow,
  WhatsAppMessageLogStatus,
  WhatsAppMessageTemplateRow,
  WhatsAppMessageTemplateType,
  WhatsAppMessageType,
} from "./database";

export type {
  StoreSettingsRow,
  OrderItemSnapshot,
  OrderStatus,
  CustomerBenefitStatus,
  WhatsAppMessageType,
  WhatsAppMessageTemplateType,
  WhatsAppMessageLogStatus,
};

export type Order = OrderRow;

export type Category = CategoryRow;
export type ProductImage = ProductImageRow;
export type SeasonalCampaign = SeasonalCampaignRow;
export type Customer = CustomerRow;
export type CustomerWithBirthday = CustomerWithBirthdayRow;
export type CustomerBenefit = CustomerBenefitRow;
export type WhatsAppMessageTemplate = WhatsAppMessageTemplateRow;
export type WhatsAppMessageLog = WhatsAppMessageLogRow;

export interface Product extends ProductRow {
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  images: ProductImage[];
}

/** Subconjunto público e seguro de store_settings (sem campos administrativos). */
export type PublicStoreSettings = Pick<
  StoreSettingsRow,
  | "store_name"
  | "slogan"
  | "about_text"
  | "whatsapp"
  | "instagram_url"
  | "address"
  | "maps_url"
  | "logo_url"
>;

export interface ProductPricing {
  basePrice: number;
  finalPrice: number;
  isPromotionActive: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  note?: string;
}

export type ProductSortOption =
  "relevance" | "price_asc" | "price_desc" | "name_asc";

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  campaignSlug?: string;
  sort?: ProductSortOption;
  featuredOnly?: boolean;
  promotionsOnly?: boolean;
  page?: number;
  pageSize?: number;
}

import type {
  CategoryRow,
  ProductImageRow,
  ProductRow,
  StoreSettingsRow,
} from "./database";

export type { StoreSettingsRow };

export type Category = CategoryRow;
export type ProductImage = ProductImageRow;

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
}

export type ProductSortOption =
  "relevance" | "price_asc" | "price_desc" | "name_asc";

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  sort?: ProductSortOption;
  featuredOnly?: boolean;
  promotionsOnly?: boolean;
  page?: number;
  pageSize?: number;
}

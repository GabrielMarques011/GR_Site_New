import type {
  CategoryRow,
  CustomerBenefitRow,
  CustomerBenefitStatus,
  CustomerRow,
  CustomerWithBirthdayRow,
  MaterialPurchaseItemInput,
  MaterialPurchaseItemRow,
  MaterialPurchaseRow,
  MaterialPurchaseStatus,
  OrderChargeLogRow,
  OrderChargeLogStatus,
  OrderItemSnapshot,
  OrderPaymentStatus,
  OrderRow,
  OrderStatus,
  ProductImageRow,
  ProductOptionRow,
  ProductRow,
  SeasonalCampaignRow,
  StockMovementRow,
  StockMovementType,
  StoreSettingsRow,
  SupplierRow,
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
  OrderPaymentStatus,
  OrderChargeLogStatus,
  CustomerBenefitStatus,
  MaterialPurchaseStatus,
  MaterialPurchaseItemInput,
  StockMovementType,
  WhatsAppMessageType,
  WhatsAppMessageTemplateType,
  WhatsAppMessageLogStatus,
};

export type Order = OrderRow;
export type OrderChargeLog = OrderChargeLogRow;

export type Supplier = SupplierRow;
export type MaterialPurchase = MaterialPurchaseRow;
export type MaterialPurchaseItem = MaterialPurchaseItemRow;
export type StockMovement = StockMovementRow;

export interface MaterialPurchaseWithItems extends MaterialPurchase {
  items: MaterialPurchaseItem[];
}

export type Category = CategoryRow;
export type ProductImage = ProductImageRow;
export type ProductOption = ProductOptionRow;
export type SeasonalCampaign = SeasonalCampaignRow;
export type Customer = CustomerRow;
export type CustomerWithBirthday = CustomerWithBirthdayRow;
export type CustomerBenefit = CustomerBenefitRow;
export type WhatsAppMessageTemplate = WhatsAppMessageTemplateRow;
export type WhatsAppMessageLog = WhatsAppMessageLogRow;

export interface Product extends ProductRow {
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  options: ProductOption[];
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
  /** Opção de compra (subproduto/kit) selecionada — `null` para compra
   * avulsa normal, por unidade. */
  optionId: string | null;
  /** Nome já combinado para exibição/pedido (ex: "Lacinho — Kit 20
   * lacinhos") — ver `buildCartItemName` em `features/cart`. */
  name: string;
  slug: string;
  /** Preço da LINHA (por unidade avulsa, ou preço total de 1 pacote da
   * opção — nunca multiplicado pela quantidade física do pacote). */
  unitPrice: number;
  /** Quantas vezes esta linha foi adicionada — unidades avulsas, ou
   * número de PACOTES quando há opção selecionada (nunca a quantidade
   * física dentro do pacote). */
  quantity: number;
  /** Quantas unidades físicas cada `quantity` representa — 1 para compra
   * avulsa, ou a quantidade fixa da opção (ex: 20 em "Kit 20 lacinhos"). */
  packageSize: number;
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

/**
 * Tipos manuais refletindo o schema já existente no projeto Supabase
 * (jcloztrhwgtvxypybzav). Não há credencial de acesso à Management API
 * disponível neste ambiente para rodar `supabase gen types` automaticamente;
 * estes tipos foram escritos a partir da documentação de schema fornecida e
 * devem ser conferidos/regenerados com o CLI assim que houver um access
 * token disponível (ver DATABASE.md).
 *
 * Observação: os tipos de linha usam `type` (não `interface`) de propósito —
 * o supabase-js exige que `Database[schema]["Tables"][tabela]["Row"]`
 * satisfaça `Record<string, unknown>`, o que só é verdade estruturalmente
 * para aliases de tipo, não para interfaces.
 */

export type AdminRole = "admin";

export type AdminProfileRow = {
  user_id: string;
  name: string;
  role: AdminRole;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SeasonalCampaignRow = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  active_until: string | null;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  category_id: string | null;
  campaign_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  promotion_start: string | null;
  promotion_end: string | null;
  sku: string | null;
  stock_quantity: number | null;
  featured: boolean;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
};

export type StoreSettingsRow = {
  id: string;
  store_name: string;
  slogan: string | null;
  about_text: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  address: string | null;
  maps_url: string | null;
  logo_url: string | null;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type OrderStatus = "em_andamento" | "concluido" | "recusado";

export type OrderItemSnapshot = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  note?: string;
};

export type OrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount_percent: number;
  total: number;
  is_first_purchase: boolean;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: AdminProfileRow;
        Insert: Partial<AdminProfileRow> & { user_id: string; name: string };
        Update: Partial<AdminProfileRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Partial<CategoryRow> & { name: string; slug: string };
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Partial<ProductRow> & {
          name: string;
          slug: string;
          price: number;
        };
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      product_images: {
        Row: ProductImageRow;
        Insert: Partial<ProductImageRow> & {
          product_id: string;
          storage_path: string;
          image_url: string;
        };
        Update: Partial<ProductImageRow>;
        Relationships: [];
      };
      store_settings: {
        Row: StoreSettingsRow;
        Insert: Partial<StoreSettingsRow> & { store_name: string };
        Update: Partial<StoreSettingsRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Partial<AuditLogRow> & { action: string; entity: string };
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow> & {
          customer_name: string;
          customer_phone: string;
          items: OrderItemSnapshot[];
          subtotal: number;
          total: number;
        };
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      seasonal_campaigns: {
        Row: SeasonalCampaignRow;
        Insert: Partial<SeasonalCampaignRow> & { slug: string; name: string };
        Update: Partial<SeasonalCampaignRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      count_orders_by_phone: {
        Args: { p_phone: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
};

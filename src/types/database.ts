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
  customer_id: string | null;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount_percent: number;
  total: number;
  is_first_purchase: boolean;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  phone_normalized: string;
  birth_date: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  whatsapp_marketing_opt_in: boolean;
  consent_date: string | null;
  consent_version: string | null;
  first_purchase_discount_used: boolean;
  first_purchase_discount_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomerWithBirthdayRow = CustomerRow & {
  birth_month: number;
  birth_day: number;
};

export type CustomerBenefitStatus =
  "disponivel" | "reservado" | "utilizado" | "cancelado";

export type CustomerBenefitRow = {
  id: string;
  customer_id: string;
  benefit_type: string;
  discount_percentage: number;
  status: CustomerBenefitStatus;
  order_reference: string | null;
  reserved_at: string | null;
  used_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WhatsAppMessageType =
  "boas_vindas" | "aniversario" | "primeira_compra" | "personalizada";

export type WhatsAppMessageTemplateType = Exclude<
  WhatsAppMessageType,
  "personalizada"
>;

export type WhatsAppMessageTemplateRow = {
  message_type: WhatsAppMessageTemplateType;
  content: string;
  updated_at: string;
};

export type WhatsAppMessageLogStatus =
  "preparada" | "enviada_manualmente" | "cancelada";

export type WhatsAppMessageLogRow = {
  id: string;
  customer_id: string;
  message_type: WhatsAppMessageType;
  message_content: string;
  status: WhatsAppMessageLogStatus;
  prepared_at: string;
  manually_confirmed_at: string | null;
  administrator_id: string | null;
  created_at: string;
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
      customers: {
        Row: CustomerRow;
        Insert: Partial<CustomerRow> & {
          full_name: string;
          phone: string;
          phone_normalized: string;
          birth_date: string;
          zip_code: string;
          street: string;
          number: string;
          neighborhood: string;
          city: string;
          state: string;
        };
        Update: Partial<CustomerRow>;
        Relationships: [];
      };
      customer_benefits: {
        Row: CustomerBenefitRow;
        Insert: Partial<CustomerBenefitRow> & { customer_id: string };
        Update: Partial<CustomerBenefitRow>;
        Relationships: [];
      };
      whatsapp_message_templates: {
        Row: WhatsAppMessageTemplateRow;
        Insert: Partial<WhatsAppMessageTemplateRow> & {
          message_type: WhatsAppMessageTemplateType;
          content: string;
        };
        Update: Partial<WhatsAppMessageTemplateRow>;
        Relationships: [];
      };
      whatsapp_message_logs: {
        Row: WhatsAppMessageLogRow;
        Insert: Partial<WhatsAppMessageLogRow> & {
          customer_id: string;
          message_type: WhatsAppMessageType;
          message_content: string;
        };
        Update: Partial<WhatsAppMessageLogRow>;
        Relationships: [];
      };
    };
    Views: {
      customers_with_birthday: {
        Row: CustomerWithBirthdayRow;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      count_orders_by_phone: {
        Args: { p_phone: string };
        Returns: number;
      };
      register_customer: {
        Args: {
          p_full_name: string;
          p_phone: string;
          p_phone_normalized: string;
          p_birth_date: string;
          p_zip_code: string;
          p_street: string;
          p_number: string;
          p_complement: string | null;
          p_neighborhood: string;
          p_city: string;
          p_state: string;
          p_whatsapp_opt_in: boolean;
          p_consent_version: string | null;
          p_session_token_hash: string;
          p_session_expires_at: string;
          p_recovery_code_hash: string;
        };
        Returns: { customer_id: string; full_name: string }[];
      };
      get_customer_session: {
        Args: { p_token_hash: string };
        Returns: {
          customer_id: string;
          full_name: string;
          phone: string;
          birth_date: string;
          zip_code: string;
          street: string;
          number: string;
          complement: string | null;
          neighborhood: string;
          city: string;
          state: string;
          whatsapp_marketing_opt_in: boolean;
          benefit_status: string;
          benefit_discount_percentage: number | null;
        }[];
      };
      recover_customer_session: {
        Args: {
          p_phone_normalized: string;
          p_code_hash: string;
          p_session_token_hash: string;
          p_session_expires_at: string;
        };
        Returns: { customer_id: string; full_name: string }[];
      };
      rotate_recovery_code: {
        Args: { p_session_token_hash: string; p_new_code_hash: string };
        Returns: boolean;
      };
      revoke_customer_session: {
        Args: { p_token_hash: string };
        Returns: undefined;
      };
      reserve_first_purchase_benefit: {
        Args: { p_customer_id: string; p_order_reference: string };
        Returns: number | null;
      };
      create_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_id: string | null;
          p_items: OrderItemSnapshot[];
          p_subtotal: number;
          p_discount_percent: number;
          p_total: number;
          p_is_first_purchase: boolean;
        };
        Returns: string;
      };
      update_order_discount: {
        Args: {
          p_order_id: string;
          p_discount_percent: number;
          p_total: number;
          p_is_first_purchase: boolean;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
};

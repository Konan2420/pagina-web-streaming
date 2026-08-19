export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      account_inventory: {
        Row: {
          access_link: string | null;
          assigned_at: string | null;
          created_at: string | null;
          email: string;
          id: string;
          notes: string | null;
          order_id: string | null;
          password: string;
          payment_verified: boolean | null;
          product_id: string;
          seller_id: string | null;
          status: string;
          supplier_id: string | null;
        };
        Insert: {
          access_link?: string | null;
          assigned_at?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          password: string;
          payment_verified?: boolean | null;
          product_id: string;
          seller_id?: string | null;
          status?: string;
          supplier_id?: string | null;
        };
        Update: {
          access_link?: string | null;
          assigned_at?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          password?: string;
          payment_verified?: boolean | null;
          product_id?: string;
          seller_id?: string | null;
          status?: string;
          supplier_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "account_inventory_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_status: {
        Row: {
          id: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          created_at: string;
          event_name: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          path: string | null;
          referrer: string | null;
          session_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_name?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          path?: string | null;
          referrer?: string | null;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_name?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          path?: string | null;
          referrer?: string | null;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      cuentas_stock: {
        Row: {
          created_at: string;
          email: string;
          estado: string | null;
          id: string;
          password: string;
          perfil: string | null;
          servicio_id: string;
          updated_at: string;
          vencimiento: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          estado?: string | null;
          id?: string;
          password: string;
          perfil?: string | null;
          servicio_id: string;
          updated_at?: string;
          vencimiento?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          estado?: string | null;
          id?: string;
          password?: string;
          perfil?: string | null;
          servicio_id?: string;
          updated_at?: string;
          vencimiento?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cuentas_stock_servicio_id_fkey";
            columns: ["servicio_id"];
            isOneToOne: false;
            referencedRelation: "servicios_streaming";
            referencedColumns: ["id"];
          },
        ];
      };
      delivered_accounts: {
        Row: {
          access_link: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          notes: string | null;
          order_id: string;
          password: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          access_link?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          notes?: string | null;
          order_id: string;
          password?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          access_link?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string;
          password?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivered_accounts_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      manual_orders: {
        Row: {
          created_at: string | null;
          estado: string | null;
          fecha_adquisicion: string;
          fecha_vencimiento: string | null;
          id: string;
          monto: number;
          nombre_cliente: string | null;
          producto_nombre: string;
          user_id: string | null;
          whatsapp_cliente: string | null;
        };
        Insert: {
          created_at?: string | null;
          estado?: string | null;
          fecha_adquisicion?: string;
          fecha_vencimiento?: string | null;
          id?: string;
          monto?: number;
          nombre_cliente?: string | null;
          producto_nombre: string;
          user_id?: string | null;
          whatsapp_cliente?: string | null;
        };
        Update: {
          created_at?: string | null;
          estado?: string | null;
          fecha_adquisicion?: string;
          fecha_vencimiento?: string | null;
          id?: string;
          monto?: number;
          nombre_cliente?: string | null;
          producto_nombre?: string;
          user_id?: string | null;
          whatsapp_cliente?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          estado: string;
          id: string;
          payment_verified: boolean | null;
          precio: number;
          producto_id: string;
          producto_nombre: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          estado?: string;
          id?: string;
          payment_verified?: boolean | null;
          precio: number;
          producto_id: string;
          producto_nombre: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          estado?: string;
          id?: string;
          payment_verified?: boolean | null;
          precio?: number;
          producto_id?: string;
          producto_nombre?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          account: string;
          amount: number;
          beneficiary_name: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          custom: Json;
          document: string | null;
          document_type: string | null;
          entity: string;
          error_message: string | null;
          father_lastname: string | null;
          first_name: string | null;
          id: string;
          message: string | null;
          mother_lastname: string | null;
          payout_caseid: string | null;
          raw_response: Json | null;
          sandbox: boolean;
          status: string;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          account: string;
          amount: number;
          beneficiary_name: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          custom?: Json;
          document?: string | null;
          document_type?: string | null;
          entity: string;
          error_message?: string | null;
          father_lastname?: string | null;
          first_name?: string | null;
          id?: string;
          message?: string | null;
          mother_lastname?: string | null;
          payout_caseid?: string | null;
          raw_response?: Json | null;
          sandbox?: boolean;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Update: {
          account?: string;
          amount?: number;
          beneficiary_name?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          custom?: Json;
          document?: string | null;
          document_type?: string | null;
          entity?: string;
          error_message?: string | null;
          father_lastname?: string | null;
          first_name?: string | null;
          id?: string;
          message?: string | null;
          mother_lastname?: string | null;
          payout_caseid?: string | null;
          raw_response?: Json | null;
          sandbox?: boolean;
          status?: string;
          transaction_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_stock: {
        Row: {
          available: number;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          available?: number;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          available?: number;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category: string | null;
          created_at: string | null;
          descripcion_larga: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          price: number;
          supplier_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          descripcion_larga?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          price: number;
          supplier_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          descripcion_larga?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          price?: number;
          supplier_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      seller_combo_items: {
        Row: {
          combo_id: string;
          id: string;
          quantity: number;
          seller_listing_id: string;
        };
        Insert: {
          combo_id: string;
          id?: string;
          quantity?: number;
          seller_listing_id: string;
        };
        Update: {
          combo_id?: string;
          id?: string;
          quantity?: number;
          seller_listing_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seller_combo_items_combo_id_fkey";
            columns: ["combo_id"];
            isOneToOne: false;
            referencedRelation: "seller_combos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seller_combo_items_seller_listing_id_fkey";
            columns: ["seller_listing_id"];
            isOneToOne: false;
            referencedRelation: "seller_listings";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_combos: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_visible: boolean;
          name: string;
          price_sale: number;
          promo_price: number | null;
          seller_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_visible?: boolean;
          name: string;
          price_sale: number;
          promo_price?: number | null;
          seller_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_visible?: boolean;
          name?: string;
          price_sale?: number;
          promo_price?: number | null;
          seller_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seller_listings: {
        Row: {
          created_at: string;
          custom_description: string | null;
          custom_name: string | null;
          id: string;
          is_visible: boolean;
          price_sale: number;
          product_id: string;
          promo_price: number | null;
          seller_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          custom_description?: string | null;
          custom_name?: string | null;
          id?: string;
          is_visible?: boolean;
          price_sale: number;
          product_id: string;
          promo_price?: number | null;
          seller_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          custom_description?: string | null;
          custom_name?: string | null;
          id?: string;
          is_visible?: boolean;
          price_sale?: number;
          product_id?: string;
          promo_price?: number | null;
          seller_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seller_listings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      seller_profiles: {
        Row: {
          banner_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          slug: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          banner_url?: string | null;
          created_at?: string;
          display_name: string;
          id?: string;
          slug: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          banner_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          id: string;
          nombre_completo: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id: string;
          nombre_completo?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          nombre_completo?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      servicios_streaming: {
        Row: {
          categoria: string;
          created_at: string;
          icono: string | null;
          id: string;
          nombre: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          categoria: string;
          created_at?: string;
          icono?: string | null;
          id?: string;
          nombre: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          categoria?: string;
          created_at?: string;
          icono?: string | null;
          id?: string;
          nombre?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_profiles: {
        Row: {
          avatar_effect: string;
          avatar_url: string | null;
          commission_rate: number;
          display_name: string;
          id: string;
          is_verified: boolean | null;
          joined_at: string | null;
          rating: number | null;
          total_reviews: number;
          total_sales: number | null;
          user_id: string;
        };
        Insert: {
          avatar_effect?: string;
          avatar_url?: string | null;
          commission_rate?: number;
          display_name: string;
          id?: string;
          is_verified?: boolean | null;
          joined_at?: string | null;
          rating?: number | null;
          total_reviews?: number;
          total_sales?: number | null;
          user_id: string;
        };
        Update: {
          avatar_effect?: string;
          avatar_url?: string | null;
          commission_rate?: number;
          display_name?: string;
          id?: string;
          is_verified?: boolean | null;
          joined_at?: string | null;
          rating?: number | null;
          total_reviews?: number;
          total_sales?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      supplier_ratings: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          order_id: string | null;
          rating: number;
          supplier_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string | null;
          rating: number;
          supplier_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          order_id?: string | null;
          rating?: number;
          supplier_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_ratings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ventas: {
        Row: {
          created_at: string;
          cuenta_id: string | null;
          estado_pago: string | null;
          id: string;
          metodo_pago: string | null;
          monto: number;
          producto_nombre: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          cuenta_id?: string | null;
          estado_pago?: string | null;
          id?: string;
          metodo_pago?: string | null;
          monto: number;
          producto_nombre: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          cuenta_id?: string | null;
          estado_pago?: string | null;
          id?: string;
          metodo_pago?: string | null;
          monto?: number;
          producto_nombre?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ventas_cuenta_id_fkey";
            columns: ["cuenta_id"];
            isOneToOne: false;
            referencedRelation: "cuentas_stock";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      asignar_cuenta_streaming: {
        Args: {
          p_metodo_pago: string;
          p_monto: number;
          p_servicio_slug: string;
          p_user_id: string;
        };
        Returns: {
          email: string;
          password: string;
          perfil: string;
          venta_id: string;
        }[];
      };
      assign_inventory_to_order: {
        Args: { _order_id: string; _product_id: string };
        Returns: boolean;
      };
      get_public_suppliers: {
        Args: { _user_ids: string[] };
        Returns: {
          avatar_effect: string;
          avatar_url: string;
          display_name: string;
          is_verified: boolean;
          rating: number;
          total_reviews: number;
          user_id: string;
        }[];
      };
      get_stock_counts: {
        Args: { _product_ids: string[] };
        Returns: {
          available: number;
          product_id: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user" | "editor" | "proveedor" | "vendedor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "editor", "proveedor", "vendedor"],
    },
  },
} as const;

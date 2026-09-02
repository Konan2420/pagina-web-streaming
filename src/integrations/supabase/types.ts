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
          {
            foreignKeyName: "account_inventory_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "users";
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
          auto_renew: boolean;
          auto_renew_at: string | null;
          business_client_id: string | null;
          client_id: string | null;
          cost_total_pen: number | null;
          created_at: string;
          created_by: string | null;
          estado: string;
          fecha_vencimiento: string | null;
          id: string;
          payment_verified: boolean | null;
          precio: number;
          producto_id: string;
          producto_nombre: string;
          profit_pen: number | null;
          sale_price_pen: number | null;
          unit_cost_pen: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_renew?: boolean;
          auto_renew_at?: string | null;
          business_client_id?: string | null;
          client_id?: string | null;
          cost_total_pen?: number | null;
          created_at?: string;
          created_by?: string | null;
          estado?: string;
          fecha_vencimiento?: string | null;
          id?: string;
          payment_verified?: boolean | null;
          precio: number;
          producto_id: string;
          producto_nombre: string;
          profit_pen?: number | null;
          sale_price_pen?: number | null;
          unit_cost_pen?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_renew?: boolean;
          auto_renew_at?: string | null;
          business_client_id?: string | null;
          client_id?: string | null;
          cost_total_pen?: number | null;
          created_at?: string;
          created_by?: string | null;
          estado?: string;
          fecha_vencimiento?: string | null;
          id?: string;
          payment_verified?: boolean | null;
          precio?: number;
          producto_id?: string;
          producto_nombre?: string;
          profit_pen?: number | null;
          sale_price_pen?: number | null;
          unit_cost_pen?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      owner_notifications: {
        Row: {
          body: string;
          catalog_order_id: string | null;
          created_at: string;
          id: string;
          notification_type: string;
          product_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          catalog_order_id?: string | null;
          created_at?: string;
          id?: string;
          notification_type?: string;
          product_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          catalog_order_id?: string | null;
          created_at?: string;
          id?: string;
          notification_type?: string;
          product_id?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "owner_notifications_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
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
      product_price_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          new_price: number;
          previous_price: number | null;
          product_id: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_price: number;
          previous_price?: number | null;
          product_id: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_price?: number;
          previous_price?: number | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string | null;
          account_type: string;
          access_scope: string;
          created_at: string | null;
          descripcion_larga: string | null;
          description: string | null;
          duration_days: number;
          id: string;
          icon_id: string | null;
          image_url: string | null;
          is_active: boolean | null;
          is_catalog_available: boolean;
          is_renewable: boolean;
          name: string;
          price: number;
          publisher_name: string | null;
          service_id: string | null;
          supplier_id: string | null;
          total_vendidos: number;
          total_vistas: number;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          account_type?: string;
          access_scope?: string;
          created_at?: string | null;
          descripcion_larga?: string | null;
          description?: string | null;
          duration_days?: number;
          id?: string;
          icon_id?: string | null;
          image_url?: string | null;
          is_active?: boolean | null;
          is_catalog_available?: boolean;
          is_renewable?: boolean;
          name: string;
          price: number;
          publisher_name?: string | null;
          service_id?: string | null;
          supplier_id?: string | null;
          total_vendidos?: number;
          total_vistas?: number;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          account_type?: string;
          access_scope?: string;
          created_at?: string | null;
          descripcion_larga?: string | null;
          description?: string | null;
          duration_days?: number;
          id?: string;
          icon_id?: string | null;
          image_url?: string | null;
          is_active?: boolean | null;
          is_catalog_available?: boolean;
          is_renewable?: boolean;
          name?: string;
          price?: number;
          publisher_name?: string | null;
          service_id?: string | null;
          supplier_id?: string | null;
          total_vendidos?: number;
          total_vistas?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_product_costs: {
        Row: {
          product_id: string;
          unit_cost_pen: number;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          unit_cost_pen: number;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          unit_cost_pen?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_product_costs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_pricing_settings: {
        Row: {
          default_markup_percent: number;
          id: string;
          pen_per_usd: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          default_markup_percent?: number;
          id?: string;
          pen_per_usd?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          default_markup_percent?: number;
          id?: string;
          pen_per_usd?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      store_combo_items: {
        Row: {
          combo_id: string;
          created_at: string;
          quantity: number;
          store_product_override_id: string;
        };
        Insert: {
          combo_id: string;
          created_at?: string;
          quantity?: number;
          store_product_override_id: string;
        };
        Update: {
          combo_id?: string;
          created_at?: string;
          quantity?: number;
          store_product_override_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_combo_items_combo_id_fkey";
            columns: ["combo_id"];
            isOneToOne: false;
            referencedRelation: "store_combos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_combo_items_store_product_override_id_fkey";
            columns: ["store_product_override_id"];
            isOneToOne: false;
            referencedRelation: "store_product_overrides";
            referencedColumns: ["id"];
          },
        ];
      };
      store_combos: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          is_visible: boolean;
          name: string;
          promo_price_pen: number | null;
          sale_price_pen: number;
          store_owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean;
          name: string;
          promo_price_pen?: number | null;
          sale_price_pen: number;
          store_owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean;
          name?: string;
          promo_price_pen?: number | null;
          sale_price_pen?: number;
          store_owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_combos_store_owner_id_fkey";
            columns: ["store_owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      store_product_overrides: {
        Row: {
          created_at: string;
          custom_description: string | null;
          custom_name: string | null;
          display_order: number;
          id: string;
          is_visible: boolean;
          master_product_id: string | null;
          promo_price_pen: number | null;
          sale_price_pen: number | null;
          social_service_id: string | null;
          source_type: string;
          store_owner_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          custom_description?: string | null;
          custom_name?: string | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean;
          master_product_id?: string | null;
          promo_price_pen?: number | null;
          sale_price_pen?: number | null;
          social_service_id?: string | null;
          source_type: string;
          store_owner_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          custom_description?: string | null;
          custom_name?: string | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean;
          master_product_id?: string | null;
          promo_price_pen?: number | null;
          sale_price_pen?: number | null;
          social_service_id?: string | null;
          source_type?: string;
          store_owner_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_product_overrides_master_product_id_fkey";
            columns: ["master_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_product_overrides_social_service_id_fkey";
            columns: ["social_service_id"];
            isOneToOne: false;
            referencedRelation: "social_service_catalog";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_product_overrides_store_owner_id_fkey";
            columns: ["store_owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      storefront_settings: {
        Row: {
          availability_mode: string;
          avatar_frame_key: string | null;
          banner_url: string | null;
          closes_at: string | null;
          created_at: string;
          description: string | null;
          display_name: string;
          facebook_url: string | null;
          instagram_url: string | null;
          is_available: boolean;
          is_public: boolean;
          logo_url: string | null;
          last_published_at: string | null;
          last_published_by: string | null;
          opens_at: string | null;
          store_owner_id: string;
          store_slug: string;
          template_key: string;
          tiktok_url: string | null;
          timezone: string;
          updated_at: string;
          x_url: string | null;
          youtube_url: string | null;
        };
        Insert: {
          availability_mode?: string;
          avatar_frame_key?: string | null;
          banner_url?: string | null;
          closes_at?: string | null;
          created_at?: string;
          description?: string | null;
          display_name: string;
          facebook_url?: string | null;
          instagram_url?: string | null;
          is_available?: boolean;
          is_public?: boolean;
          logo_url?: string | null;
          last_published_at?: string | null;
          last_published_by?: string | null;
          opens_at?: string | null;
          store_owner_id: string;
          store_slug: string;
          template_key?: string;
          tiktok_url?: string | null;
          timezone?: string;
          updated_at?: string;
          x_url?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          availability_mode?: string;
          avatar_frame_key?: string | null;
          banner_url?: string | null;
          closes_at?: string | null;
          created_at?: string;
          description?: string | null;
          display_name?: string;
          facebook_url?: string | null;
          instagram_url?: string | null;
          is_available?: boolean;
          is_public?: boolean;
          logo_url?: string | null;
          last_published_at?: string | null;
          last_published_by?: string | null;
          opens_at?: string | null;
          store_owner_id?: string;
          store_slug?: string;
          template_key?: string;
          tiktok_url?: string | null;
          timezone?: string;
          updated_at?: string;
          x_url?: string | null;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "storefront_settings_store_owner_id_fkey";
            columns: ["store_owner_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
      business_clients: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          is_blocked: boolean;
          nombre: string;
          owner_id: string;
          profile_id: string | null;
          telefono: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_blocked?: boolean;
          nombre: string;
          owner_id: string;
          profile_id?: string | null;
          telefono?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          is_blocked?: boolean;
          nombre?: string;
          owner_id?: string;
          profile_id?: string | null;
          telefono?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_client_tags: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_client_tag_assignments: {
        Row: {
          client_id: string;
          created_at: string;
          tag_id: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          tag_id: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      distributor_profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          is_active: boolean;
          joined_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id?: string;
          is_active?: boolean;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          joined_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      supplier_profiles: {
        Row: {
          avatar_url: string | null;
          commission_rate: number | null;
          created_at: string | null;
          display_name: string;
          id: string;
          is_verified: boolean | null;
          joined_at: string | null;
          rating: number | null;
          total_reviews: number | null;
          total_sales: number | null;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          commission_rate?: number | null;
          created_at?: string | null;
          display_name: string;
          id?: string;
          is_verified?: boolean | null;
          joined_at?: string | null;
          rating?: number | null;
          total_reviews?: number | null;
          total_sales?: number | null;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          commission_rate?: number | null;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          is_verified?: boolean | null;
          joined_at?: string | null;
          rating?: number | null;
          total_reviews?: number | null;
          total_sales?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      payment_settings: {
        Row: {
          binance_pay_id: string | null;
          binance_qr_url: string | null;
          id: string;
          lemon_qr_url: string | null;
          lemon_tag: string | null;
          updated_at: string;
          updated_by: string | null;
          yape_plin_contact: string | null;
          yape_plin_qr_url: string | null;
        };
        Insert: {
          binance_pay_id?: string | null;
          binance_qr_url?: string | null;
          id?: string;
          lemon_qr_url?: string | null;
          lemon_tag?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          yape_plin_contact?: string | null;
          yape_plin_qr_url?: string | null;
        };
        Update: {
          binance_pay_id?: string | null;
          binance_qr_url?: string | null;
          id?: string;
          lemon_qr_url?: string | null;
          lemon_tag?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          yape_plin_contact?: string | null;
          yape_plin_qr_url?: string | null;
        };
        Relationships: [];
      };
      recargas: {
        Row: {
          beneficiario_email: string | null;
          beneficiario_id: string | null;
          created_at: string;
          estado: Database["public"]["Enums"]["recarga_status"];
          id: string;
          metodo: Database["public"]["Enums"]["recarga_method"];
          moneda: Database["public"]["Enums"]["recarga_currency"];
          monto: number;
          monto_acreditado_pen: number | null;
          motivo_rechazo: string | null;
          nombre_declarado: string;
          para_otro_usuario: boolean;
          updated_at: string;
          user_id: string;
          verificado_at: string | null;
          verificado_por: string | null;
        };
        Insert: {
          beneficiario_email?: string | null;
          beneficiario_id?: string | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["recarga_status"];
          id?: string;
          metodo: Database["public"]["Enums"]["recarga_method"];
          moneda: Database["public"]["Enums"]["recarga_currency"];
          monto: number;
          monto_acreditado_pen?: number | null;
          motivo_rechazo?: string | null;
          nombre_declarado: string;
          para_otro_usuario?: boolean;
          updated_at?: string;
          user_id?: string;
          verificado_at?: string | null;
          verificado_por?: string | null;
        };
        Update: {
          beneficiario_email?: string | null;
          beneficiario_id?: string | null;
          created_at?: string;
          estado?: Database["public"]["Enums"]["recarga_status"];
          id?: string;
          metodo?: Database["public"]["Enums"]["recarga_method"];
          moneda?: Database["public"]["Enums"]["recarga_currency"];
          monto?: number;
          monto_acreditado_pen?: number | null;
          motivo_rechazo?: string | null;
          nombre_declarado?: string;
          para_otro_usuario?: boolean;
          updated_at?: string;
          user_id?: string;
          verificado_at?: string | null;
          verificado_por?: string | null;
        };
        Relationships: [];
      };
      ticket_respuestas: {
        Row: {
          author_id: string;
          autor: Database["public"]["Enums"]["ticket_author"];
          created_at: string;
          id: string;
          mensaje: string;
          ticket_id: string;
        };
        Insert: {
          author_id?: string;
          autor?: Database["public"]["Enums"]["ticket_author"];
          created_at?: string;
          id?: string;
          mensaje: string;
          ticket_id: string;
        };
        Update: {
          author_id?: string;
          autor?: Database["public"]["Enums"]["ticket_author"];
          created_at?: string;
          id?: string;
          mensaje?: string;
          ticket_id?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          asunto: string;
          categoria: Database["public"]["Enums"]["ticket_category"];
          created_at: string;
          descripcion: string;
          estado: Database["public"]["Enums"]["ticket_status"];
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          asunto: string;
          categoria: Database["public"]["Enums"]["ticket_category"];
          created_at?: string;
          descripcion: string;
          estado?: Database["public"]["Enums"]["ticket_status"];
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          asunto?: string;
          categoria?: Database["public"]["Enums"]["ticket_category"];
          created_at?: string;
          descripcion?: string;
          estado?: Database["public"]["Enums"]["ticket_status"];
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      social_service_catalog: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          max_quantity: number;
          metadata: Json;
          min_quantity: number;
          name: string;
          platform: string;
          provider_key: string;
          provider_service_id: string;
          provider_updated_at: string | null;
          unit_cost_pen: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          max_quantity: number;
          metadata?: Json;
          min_quantity: number;
          name: string;
          platform: string;
          provider_key: string;
          provider_service_id: string;
          provider_updated_at?: string | null;
          unit_cost_pen: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          max_quantity?: number;
          metadata?: Json;
          min_quantity?: number;
          name?: string;
          platform?: string;
          provider_key?: string;
          provider_service_id?: string;
          provider_updated_at?: string | null;
          unit_cost_pen?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_service_orders: {
        Row: {
          business_client_id: string | null;
          category: string;
          client_id: string;
          cost_total_pen: number;
          created_at: string;
          created_by: string;
          external_order_id: string | null;
          failure_reason: string | null;
          id: string;
          initial_quantity: number | null;
          platform: string;
          profit_pen: number;
          provider_key: string;
          provider_response: Json | null;
          provider_service_id: string;
          quantity: number;
          sale_price_pen: number;
          service_id: string;
          service_name: string;
          status: string;
          target_url: string;
          unit_cost_pen: number;
          updated_at: string;
        };
        Insert: {
          business_client_id?: string | null;
          category: string;
          client_id: string;
          cost_total_pen: number;
          created_at?: string;
          created_by: string;
          external_order_id?: string | null;
          failure_reason?: string | null;
          id?: string;
          initial_quantity?: number | null;
          platform: string;
          profit_pen: number;
          provider_key: string;
          provider_response?: Json | null;
          provider_service_id: string;
          quantity: number;
          sale_price_pen: number;
          service_id: string;
          service_name: string;
          status?: string;
          target_url: string;
          unit_cost_pen: number;
          updated_at?: string;
        };
        Update: {
          business_client_id?: string | null;
          category?: string;
          client_id?: string;
          cost_total_pen?: number;
          created_at?: string;
          created_by?: string;
          external_order_id?: string | null;
          failure_reason?: string | null;
          id?: string;
          initial_quantity?: number | null;
          platform?: string;
          profit_pen?: number;
          provider_key?: string;
          provider_response?: Json | null;
          provider_service_id?: string;
          quantity?: number;
          sale_price_pen?: number;
          service_id?: string;
          service_name?: string;
          status?: string;
          target_url?: string;
          unit_cost_pen?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_service_orders_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "social_service_catalog";
            referencedColumns: ["id"];
          },
        ];
      };
      social_service_provider_status: {
        Row: {
          catalog_synced_at: string | null;
          id: string;
          is_configured: boolean;
          provider_key: string | null;
          provider_label: string | null;
          updated_at: string;
        };
        Insert: {
          catalog_synced_at?: string | null;
          id?: string;
          is_configured?: boolean;
          provider_key?: string | null;
          provider_label?: string | null;
          updated_at?: string;
        };
        Update: {
          catalog_synced_at?: string | null;
          id?: string;
          is_configured?: boolean;
          provider_key?: string | null;
          provider_label?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          amount_pen: number;
          balance_after_pen: number;
          catalog_order_id: string | null;
          created_at: string;
          description: string;
          id: string;
          social_service_order_id: string | null;
          transaction_type: string;
          user_id: string;
        };
        Insert: {
          amount_pen: number;
          balance_after_pen: number;
          catalog_order_id?: string | null;
          created_at?: string;
          description: string;
          id?: string;
          social_service_order_id?: string | null;
          transaction_type: string;
          user_id: string;
        };
        Update: {
          amount_pen?: number;
          balance_after_pen?: number;
          catalog_order_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          social_service_order_id?: string | null;
          transaction_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_social_service_order_id_fkey";
            columns: ["social_service_order_id"];
            isOneToOne: false;
            referencedRelation: "social_service_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_balances: {
        Row: {
          saldo_pen: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          saldo_pen?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          saldo_pen?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      servicios_streaming: {
        Row: {
          categoria: string;
          created_at: string;
          display_order: number;
          icono: string | null;
          icon_url: string | null;
          id: string;
          is_visible: boolean;
          nombre: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          categoria: string;
          created_at?: string;
          display_order?: number;
          icono?: string | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean;
          nombre: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          categoria?: string;
          created_at?: string;
          display_order?: number;
          icono?: string | null;
          icon_url?: string | null;
          id?: string;
          is_visible?: boolean;
          nombre?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
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
      approve_recarga: {
        Args: { _monto_acreditado_pen: number; _recarga_id: string };
        Returns: Database["public"]["Tables"]["recargas"]["Row"];
      };
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
      get_stock_counts: {
        Args: { _product_ids: string[] };
        Returns: {
          available: number;
          product_id: string;
        }[];
      };
      get_catalog_product_activity: {
        Args: { _product_ids: string[] };
        Returns: {
          last_sale_at: string | null;
          product_id: string;
        }[];
      };
      get_catalog_order_clients: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          nombre_completo: string | null;
          whatsapp: string | null;
        }[];
      };
      ensure_self_business_client: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_business_client_metrics: {
        Args: { p_owner_id?: string | null };
        Returns: {
          active_clients: number;
          blocked_clients: number;
          inactive_clients: number;
          total_clients: number;
        }[];
      };
      get_business_clients: {
        Args: { p_owner_id?: string | null };
        Returns: {
          created_at: string;
          email: string | null;
          id: string;
          is_blocked: boolean;
          last_purchase: string | null;
          nombre: string;
          owner_id: string;
          tags: Json;
          telefono: string | null;
          total_purchases: number;
          total_spent_pen: number;
        }[];
      };
      get_business_client_owners: {
        Args: Record<PropertyKey, never>;
        Returns: {
          display_name: string;
          owner_id: string;
        }[];
      };
      get_catalog_purchase_context: {
        Args: { p_product_id: string };
        Returns: Json;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      place_order_with_inventory: {
        Args: { _product_id: string };
        Returns: {
          order_id: string;
          price: number;
          product_name: string;
        }[];
      };
      place_catalog_order_from_wallet: {
        Args: {
          p_auto_renew?: boolean;
          p_client_id: string;
          p_product_id: string;
          p_sale_price_pen: number;
        };
        Returns: {
          charged_pen: number;
          charged_usd: number;
          expires_on: string;
          order_id: string;
          profit_pen: number;
          sale_price_pen: number;
        }[];
      };
      place_orders_with_inventory: {
        Args: { _product_ids: string[] };
        Returns: {
          order_id: string;
          price: number;
          product_name: string;
        }[];
      };
      place_social_service_order: {
        Args: {
          p_client_id: string;
          p_quantity: number;
          p_sale_price_pen: number;
          p_service_id: string;
          p_target_url: string;
        };
        Returns: string;
      };
      place_storefront_catalog_order_from_wallet: {
        Args: {
          p_auto_renew?: boolean;
          p_store_product_override_id: string;
          p_store_slug: string;
        };
        Returns: {
          charged_pen: number;
          expires_on: string;
          order_id: string;
          profit_credited_pen: number;
        }[];
      };
      publish_storefront_settings: {
        Args: {
          p_owner_id: string;
          p_store_slug: string;
          p_display_name: string;
          p_description: string | null;
          p_logo_url: string | null;
          p_banner_url: string | null;
          p_is_public: boolean;
          p_availability_mode: string;
          p_is_available: boolean;
          p_opens_at: string | null;
          p_closes_at: string | null;
          p_timezone: string;
          p_template_key: string;
          p_avatar_frame_key: string | null;
          p_facebook_url: string | null;
          p_instagram_url: string | null;
          p_tiktok_url: string | null;
          p_x_url: string | null;
          p_youtube_url: string | null;
        };
        Returns: Database["public"]["Tables"]["storefront_settings"]["Row"];
      };
      get_storefront_supervision_list: {
        Args: Record<PropertyKey, never>;
        Returns: {
          owner_id: string;
          owner_name: string;
          owner_role: string;
          logo_url: string | null;
          template_key: string;
          is_public: boolean;
          last_published_at: string | null;
          product_count: number;
          total_sales: number;
        }[];
      };
      reject_recarga: {
        Args: { _motivo?: string; _recarga_id: string };
        Returns: Database["public"]["Tables"]["recargas"]["Row"];
      };
      record_catalog_product_view: {
        Args: { p_product_id: string };
        Returns: number;
      };
    };
    Enums: {
      app_role: "admin" | "proveedor" | "distribuidor" | "user";
      recarga_currency: "PEN" | "USD";
      recarga_method: "lemon_cash" | "yape_plin" | "binance";
      recarga_status: "pendiente" | "verificado" | "rechazado";
      ticket_author: "usuario" | "admin";
      ticket_category: "pago" | "producto_cuenta" | "cuenta_usuario" | "otro";
      ticket_status: "abierto" | "respondido" | "cerrado";
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
      app_role: ["admin", "proveedor", "distribuidor", "user"],
      recarga_currency: ["PEN", "USD"],
      recarga_method: ["lemon_cash", "yape_plin", "binance"],
      recarga_status: ["pendiente", "verificado", "rechazado"],
      ticket_author: ["usuario", "admin"],
      ticket_category: ["pago", "producto_cuenta", "cuenta_usuario", "otro"],
      ticket_status: ["abierto", "respondido", "cerrado"],
    },
  },
} as const;

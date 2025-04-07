export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      AA_Daily_Reflections: {
        Row: {
          book_name: string | null;
          created_at: string;
          date_string: string;
          month_day: string;
          page_number: number | null;
          quote_text: string | null;
          reflection: string | null;
          title: string | null;
        };
        Insert: {
          book_name?: string | null;
          created_at?: string;
          date_string: string;
          month_day: string;
          page_number?: number | null;
          quote_text?: string | null;
          reflection?: string | null;
          title?: string | null;
        };
        Update: {
          book_name?: string | null;
          created_at?: string;
          date_string?: string;
          month_day?: string;
          page_number?: number | null;
          quote_text?: string | null;
          reflection?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
      Hazelden_Book: {
        Row: {
          buy_url: string | null;
          created_at: string;
          description: string;
          id: number;
          image_url: string | null;
          subtitle: string;
          title: string;
        };
        Insert: {
          buy_url?: string | null;
          created_at?: string;
          description: string;
          id?: number;
          image_url?: string | null;
          subtitle: string;
          title: string;
        };
        Update: {
          buy_url?: string | null;
          created_at?: string;
          description?: string;
          id?: number;
          image_url?: string | null;
          subtitle?: string;
          title?: string;
        };
        Relationships: [];
      };
      Hazelden_Reading: {
        Row: {
          book_title: string | null;
          created_at: string;
          date_string: string;
          id: number;
          quote: string | null;
          title: string | null;
        };
        Insert: {
          book_title?: string | null;
          created_at?: string;
          date_string: string;
          id?: number;
          quote?: string | null;
          title?: string | null;
        };
        Update: {
          book_title?: string | null;
          created_at?: string;
          date_string?: string;
          id?: number;
          quote?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'Hazelden_Reading_book_title_fkey';
            columns: ['book_title'];
            isOneToOne: false;
            referencedRelation: 'Hazelden_Book';
            referencedColumns: ['title'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends (
    { schema: keyof Database }
  ) ?
    keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])
  : never = never,
> =
  PublicTableNameOrOptions extends { schema: keyof Database } ?
    (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends (
      {
        Row: infer R;
      }
    ) ?
      R
    : never
  : PublicTableNameOrOptions extends (
    keyof (PublicSchema['Tables'] & PublicSchema['Views'])
  ) ?
    (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends (
      {
        Row: infer R;
      }
    ) ?
      R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends (
    { schema: keyof Database }
  ) ?
    keyof Database[PublicTableNameOrOptions['schema']]['Tables']
  : never = never,
> =
  PublicTableNameOrOptions extends { schema: keyof Database } ?
    Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends (
      {
        Insert: infer I;
      }
    ) ?
      I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables'] ?
    PublicSchema['Tables'][PublicTableNameOrOptions] extends (
      {
        Insert: infer I;
      }
    ) ?
      I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends (
    { schema: keyof Database }
  ) ?
    keyof Database[PublicTableNameOrOptions['schema']]['Tables']
  : never = never,
> =
  PublicTableNameOrOptions extends { schema: keyof Database } ?
    Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends (
      {
        Update: infer U;
      }
    ) ?
      U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables'] ?
    PublicSchema['Tables'][PublicTableNameOrOptions] extends (
      {
        Update: infer U;
      }
    ) ?
      U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database } ?
    keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
  : never = never,
> =
  PublicEnumNameOrOptions extends { schema: keyof Database } ?
    Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] ?
    PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends (
    {
      schema: keyof Database;
    }
  ) ?
    keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
  : never = never,
> =
  PublicCompositeTypeNameOrOptions extends { schema: keyof Database } ?
    Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends (
    keyof PublicSchema['CompositeTypes']
  ) ?
    PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          status: string;
          progress: number;
          due_date: string | null;
          color: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          status?: string;
          progress?: number;
          due_date?: string | null;
          color?: string;
          user_id?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          status?: string;
          progress?: number;
          due_date?: string | null;
          color?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          status: string;
          priority: string;
          project_id: string | null;
          due_date: string | null;
          description: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          status?: string;
          priority?: string;
          project_id?: string | null;
          due_date?: string | null;
          description?: string | null;
          user_id?: string | null;
        };
        Update: {
          title?: string;
          status?: string;
          priority?: string;
          project_id?: string | null;
          due_date?: string | null;
          description?: string | null;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          type: string;
          start_time: string;
          end_time: string;
          location: string | null;
          description: string | null;
          recurring: string;
          linked_task_id: string | null;
          linked_project_id: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          type?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          description?: string | null;
          recurring?: string;
          linked_task_id?: string | null;
          linked_project_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          title?: string;
          date?: string;
          type?: string;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          description?: string | null;
          recurring?: string;
          linked_task_id?: string | null;
          linked_project_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

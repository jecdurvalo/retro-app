import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const SESSION_ID = process.env.NEXT_PUBLIC_SESSION_ID!

export type Category = 'went_well' | 'to_improve' | 'action_items'

export interface RetroItem {
  id: string
  session_id: string
  category: Category
  content: string
  author_name: string | null
  created_at: string
}

export const CATEGORIES: { key: Category; label: string; emoji: string; color: string; bg: string }[] = [
  { key: 'went_well', label: 'Mandamos muito bem', emoji: '01', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  { key: 'to_improve', label: 'Podemos melhorar', emoji: '02', color: 'text-zinc-700', bg: 'bg-zinc-50 border-zinc-200' },
  { key: 'action_items', label: 'Vamos repensar', emoji: '03', color: 'text-stone-700', bg: 'bg-stone-50 border-stone-200' },
]

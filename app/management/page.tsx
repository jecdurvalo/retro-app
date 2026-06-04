'use client'

import { useEffect, useMemo, useState } from 'react'
import { parseMoodItem } from '@/lib/mood'
import {
  loadManagementPlans,
  loadRetroSnapshots,
  type ManagementPlan,
  type RetroSnapshot,
} from '@/lib/management'
import { SESSION_ID, supabase, type RetroItem } from '@/lib/supabase'
import CockpitOverview from './cockpit-overview'
import ExecutiveReading from './executive-reading'
import ManagementCopilot from './management-copilot'

export default function ManagementPage() {
  const [plans] = useState<ManagementPlan[]>(loadManagementPlans)
  const [snapshots] = useState<RetroSnapshot[]>(loadRetroSnapshots)
  const [items, setItems] = useState<RetroItem[]>([])

  useEffect(() => {
    supabase
      .from('retro_items')
      .select('*')
      .eq('session_id', SESSION_ID)
      .order('created_at', { ascending: true })
      .then(({ data }) => setItems(data || []))
  }, [])

  const currentMood = useMemo(() => {
    const moodEntries = items.map(parseMoodItem).filter(entry => entry !== null)
    if (moodEntries.length === 0) return null

    return moodEntries.reduce((sum, entry) => sum + entry.score, 0) / moodEntries.length
  }, [items])

  return (
    <main id="main-content" className="min-h-screen bg-[var(--retro-bg)] px-4 py-4 text-[var(--retro-ink)] sm:px-6 lg:px-8">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(135,0,47,0.12),rgba(255,255,255,0.96)_32%,rgba(247,242,240,0.98)),radial-gradient(circle_at_88%_8%,rgba(52,232,207,0.2),transparent_24%)]" />

      <section aria-label="Visão geral do cockpit de gestão" className="mx-auto max-w-7xl">
        <CockpitOverview plans={plans} />
        <ExecutiveReading plans={plans} snapshots={snapshots} currentMood={currentMood} />
        <ManagementCopilot plans={plans} snapshots={snapshots} currentMood={currentMood} />
      </section>
    </main>
  )
}

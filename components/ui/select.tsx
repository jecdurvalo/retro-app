'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = string | { value: string; label: string }

function optionValue(option: SelectOption) {
  return typeof option === 'string' ? option : option.value
}

function optionLabel(option: SelectOption) {
  return typeof option === 'string' ? option : option.label
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  'aria-label': ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(option => optionValue(option) === value)
  const label = selected ? optionLabel(selected) : placeholder ?? ''

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)] ${className}`}
      >
        <span className={`truncate ${!selected && placeholder ? 'text-zinc-400' : ''}`}>{label}</span>
        <ChevronDown size={15} className={`shrink-0 text-zinc-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 max-h-64 w-full min-w-[12rem] overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-950/10">
          {options.map(option => {
            const optValue = optionValue(option)
            const optLabel = optionLabel(option)
            return (
              <button
                key={optValue}
                type="button"
                onClick={() => {
                  onChange(optValue)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                  optValue === value ? 'bg-[var(--retro-wine-soft)] text-[var(--retro-wine)]' : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className="truncate">{optLabel}</span>
                {optValue === value && <Check size={14} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

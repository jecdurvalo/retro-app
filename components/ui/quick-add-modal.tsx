'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'

/**
 * Shared "+" trigger that opens a small centered modal (blurred backdrop) instead
 * of leaving an always-visible inline input row on the page. Used for the many
 * lightweight "add one item" forms across the cockpit (checklists, focos, tags,
 * quick tasks...) so they share one consistent, tidier interaction.
 */
export function QuickAddModal({
  title,
  triggerLabel,
  compact = false,
  renderTrigger,
  children,
}: {
  title: string
  triggerLabel: string
  /** Smaller icon-only trigger for tight spaces (e.g. inside a card header). */
  compact?: boolean
  /** Fully custom trigger (e.g. a primary CTA button already styled for a page
   * header). Receives `open` to call instead of the built-in trigger button. */
  renderTrigger?: (open: () => void) => ReactNode
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef(() => setOpen(false))

  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={triggerLabel}
          title={triggerLabel}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-600 transition hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)]"
        >
          <Plus size={13} />
          {triggerLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-bold text-zinc-500 transition hover:border-[var(--retro-wine)] hover:text-[var(--retro-wine)]"
        >
          <Plus size={15} />
          {triggerLabel}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-4 backdrop-blur-sm"
          onMouseDown={event => {
            if (event.currentTarget === event.target) setOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-zinc-900">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4">{children(closeRef.current)}</div>
          </div>
        </div>
      )}
    </>
  )
}

/** Simple single-field "text + submit" form for the common case, meant to be
 * rendered inside a QuickAddModal's children render-prop. */
export function QuickAddTextForm({
  placeholder,
  submitLabel = 'Adicionar',
  multiline = false,
  onSubmit,
}: {
  placeholder: string
  submitLabel?: string
  multiline?: boolean
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState('')
  const canSubmit = value.trim().length > 0
  const fieldClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition placeholder:font-medium placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        const text = value.trim()
        if (!text) return
        onSubmit(text)
      }}
    >
      {multiline ? (
        <textarea autoFocus rows={3} value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} className={`${fieldClass} resize-none leading-6`} />
      ) : (
        <input autoFocus value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} className={fieldClass} />
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className="justify-self-end rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  )
}

/** Pre-filled "edit existing value" form, meant to be rendered inside a
 * QuickAddModal's children render-prop. Unlike QuickAddTextForm, an empty
 * value is a valid submission (it clears the field). */
export function EditableTextForm({
  initialValue,
  placeholder,
  submitLabel = 'Salvar',
  multiline = false,
  onSubmit,
}: {
  initialValue: string
  placeholder: string
  submitLabel?: string
  multiline?: boolean
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  const fieldClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition placeholder:font-medium placeholder:text-zinc-400 focus:border-[var(--retro-wine)] focus:ring-4 focus:ring-[var(--retro-wine-tint)]'

  return (
    <form
      className="grid gap-3"
      onSubmit={event => {
        event.preventDefault()
        onSubmit(value.trim())
      }}
    >
      {multiline ? (
        <textarea autoFocus rows={5} value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} className={`${fieldClass} resize-none leading-6`} />
      ) : (
        <input autoFocus value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} className={fieldClass} />
      )}
      <button
        type="submit"
        className="justify-self-end rounded-xl bg-[var(--retro-wine)] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[var(--retro-wine-hover)]"
      >
        {submitLabel}
      </button>
    </form>
  )
}

/** Shows a single free-text value with a small "Editar"/"Definir" trigger that
 * opens a modal to change it — used for occasional single-value fields (like
 * "Próximo passo") that shouldn't sit as an always-open textarea on the page. */
export function EditableTextField({
  label,
  value,
  onSave,
  placeholder,
  emptyText = 'Não definido ainda.',
  multiline = true,
  triggerLabel,
}: {
  label: string
  value: string
  onSave: (value: string) => void
  placeholder: string
  emptyText?: string
  multiline?: boolean
  triggerLabel?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {value ? (
          <p className="whitespace-pre-line text-sm font-medium leading-6 text-zinc-700">{value}</p>
        ) : (
          <p className="text-xs font-semibold text-zinc-400">{emptyText}</p>
        )}
      </div>
      <QuickAddModal title={label} triggerLabel={triggerLabel ?? (value ? 'Editar' : 'Definir')} compact>
        {close => (
          <EditableTextForm
            initialValue={value}
            placeholder={placeholder}
            multiline={multiline}
            onSubmit={text => {
              onSave(text)
              close()
            }}
          />
        )}
      </QuickAddModal>
    </div>
  )
}

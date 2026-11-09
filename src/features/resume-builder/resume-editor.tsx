import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Field, inputClass } from '~/components/workspace-fields'
import { limits, type DraftEntry, type DraftSection, type ResumeDraft } from './draft'

function move<T>(items: T[], index: number, offset: number) {
  const next = index + offset
  if (next < 0 || next >= items.length) return items
  const result = [...items]
  result.splice(next, 0, ...result.splice(index, 1))
  return result
}

function updateItem<T extends { id: string }>(items: T[], id: string, values: Partial<T>) {
  return items.map((item) => item.id === id ? { ...item, ...values } : item)
}

function ItemActions({ label, index, total, onMove, onRemove }: {
  label: string
  index: number
  total: number
  onMove: (offset: number) => void
  onRemove: () => void
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Move ${label} up`}
        disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Move ${label} down`}
        disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown /></Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${label}`}
        onClick={onRemove}><Trash2 /></Button>
    </div>
  )
}

function TextArea({ label, value, maxLength, rows, onChange }: {
  label: string
  value: string
  maxLength: number
  rows: number
  onChange: (text: string) => void
}) {
  const id = useId()
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="text-small font-medium">{label}</label>
      <textarea id={id} className={inputClass} rows={rows} value={value} maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function AddButton({ children, disabled, onClick }: {
  children: ReactNode
  disabled: boolean
  onClick: () => void
}) {
  return <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onClick}><Plus />{children}</Button>
}

export function ResumeEditor({ draft, onChange }: { draft: ResumeDraft; onChange: (draft: ResumeDraft) => void }) {
  function update(values: Partial<ResumeDraft>) {
    onChange({ ...draft, ...values })
  }

  const fields = [
    { name: 'name', label: 'Full name', autoComplete: 'name' },
    { name: 'headline', label: 'Professional headline' },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', maxLength: limits.contact },
    { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
    { name: 'location', label: 'Location', autoComplete: 'address-level2' },
  ] as const

  return (
    <div className="space-y-4">
      <Card className="gap-4 p-4 sm:p-5">
        <h2 className="text-subhead">Contact details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(({ name, label, ...props }) => (
            <Field key={name} label={label} maxLength={limits.shortText} {...props} value={draft[name]}
              onChange={(event) => update({ [name]: event.target.value })} />
          ))}
        </div>
      </Card>
      <Card className="gap-4 p-4 sm:p-5">
        <div>
          <h2 className="text-subhead">Social and portfolio links</h2>
          <p className="mt-1 text-small text-muted-foreground">Add LinkedIn, GitHub, or another site you want to share.</p>
        </div>
        {draft.links.map((link, index) => (
          <fieldset key={link.id} className="min-w-0 space-y-3 rounded-lg border p-3">
            <legend className="px-1 text-small font-medium">Link {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={`Link ${index + 1} label`} placeholder="LinkedIn" value={link.label} maxLength={limits.shortText}
                onChange={(event) => update({ links: updateItem(draft.links, link.id, { label: event.target.value }) })} />
              <Field label={`Link ${index + 1} URL`} placeholder="https://…" inputMode="url" value={link.url} maxLength={limits.url}
                onChange={(event) => update({ links: updateItem(draft.links, link.id, { url: event.target.value }) })} />
            </div>
            <ItemActions label={`link ${index + 1}`} index={index} total={draft.links.length}
              onMove={(offset) => update({ links: move(draft.links, index, offset) })}
              onRemove={() => update({ links: draft.links.filter(({ id }) => id !== link.id) })} />
          </fieldset>
        ))}
        <div><AddButton disabled={draft.links.length >= limits.links}
          onClick={() => update({ links: [...draft.links, { id: crypto.randomUUID(), label: '', url: '' }] })}>Add link</AddButton></div>
      </Card>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-subhead">Sections</h2>
          <AddButton disabled={draft.sections.length >= limits.sections}
            onClick={() => update({ sections: [...draft.sections, { id: crypto.randomUUID(), title: '', entries: [] }] })}>Add section</AddButton>
        </div>
        {draft.sections.length === 0 && <p className="text-small text-muted-foreground">Start with a section like Experience, Education, Projects, or Skills.</p>}
        {draft.sections.map((section, index) => (
          <SectionEditor key={section.id} section={section} index={index} total={draft.sections.length}
            onChange={(values) => update({ sections: updateItem(draft.sections, section.id, values) })}
            onMove={(offset) => update({ sections: move(draft.sections, index, offset) })}
            onRemove={() => update({ sections: draft.sections.filter(({ id }) => id !== section.id) })} />
        ))}
      </div>
    </div>
  )
}

function SectionEditor({ section, index, total, onChange, onMove, onRemove }: {
  section: DraftSection
  index: number
  total: number
  onChange: (values: Partial<DraftSection>) => void
  onMove: (offset: number) => void
  onRemove: () => void
}) {
  const sectionLabel = `section ${index + 1}`
  return (
    <Card className="gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Field label={`Section ${index + 1} title`} placeholder="Experience" value={section.title} maxLength={limits.shortText}
            onChange={(event) => onChange({ title: event.target.value })} />
        </div>
        <ItemActions label={sectionLabel} index={index} total={total} onMove={onMove} onRemove={onRemove} />
      </div>
      {section.entries.map((entry, entryIndex) => (
        <EntryEditor key={entry.id} entry={entry} index={entryIndex} total={section.entries.length}
          sectionLabel={sectionLabel}
          onChange={(values) => onChange({ entries: updateItem(section.entries, entry.id, values) })}
          onMove={(offset) => onChange({ entries: move(section.entries, entryIndex, offset) })}
          onRemove={() => onChange({ entries: section.entries.filter(({ id }) => id !== entry.id) })} />
      ))}
      <div><AddButton disabled={section.entries.length >= limits.entries}
        onClick={() => onChange({ entries: [...section.entries, {
          id: crypto.randomUUID(), title: '', organization: '', dates: '', description: '', bullets: [],
        }] })}>Add entry</AddButton></div>
    </Card>
  )
}

function EntryEditor({ entry, index, total, sectionLabel, onChange, onMove, onRemove }: {
  entry: DraftEntry
  index: number
  total: number
  sectionLabel: string
  onChange: (values: Partial<DraftEntry>) => void
  onMove: (offset: number) => void
  onRemove: () => void
}) {
  const entryLabel = `entry ${index + 1} in ${sectionLabel}`
  return (
    <fieldset className="min-w-0 space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-small font-medium">Entry {index + 1}</legend>
      <div className="flex justify-end"><ItemActions label={entryLabel} index={index} total={total} onMove={onMove} onRemove={onRemove} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Entry title" placeholder="Project Manager" value={entry.title} maxLength={limits.shortText}
          onChange={(event) => onChange({ title: event.target.value })} />
        <Field label="Organization" value={entry.organization} maxLength={limits.shortText}
          onChange={(event) => onChange({ organization: event.target.value })} />
        <Field label="Dates" placeholder="2022 – Present" value={entry.dates} maxLength={limits.shortText}
          onChange={(event) => onChange({ dates: event.target.value })} />
      </div>
      <TextArea label="Description" value={entry.description} maxLength={limits.description} rows={2}
        onChange={(description) => onChange({ description })} />
      {entry.bullets.map((bullet, bulletIndex) => (
        <div key={bullet.id} className="flex flex-wrap items-end gap-2">
          <div className="min-w-32 flex-1">
            <TextArea label={`Bullet point ${bulletIndex + 1}`} value={bullet.text} maxLength={limits.bullet} rows={2}
              onChange={(text) => onChange({ bullets: updateItem(entry.bullets, bullet.id, { text }) })} />
          </div>
          <ItemActions label={`bullet ${bulletIndex + 1} in ${entryLabel}`} index={bulletIndex} total={entry.bullets.length}
            onMove={(offset) => onChange({ bullets: move(entry.bullets, bulletIndex, offset) })}
            onRemove={() => onChange({ bullets: entry.bullets.filter(({ id }) => id !== bullet.id) })} />
        </div>
      ))}
      <AddButton disabled={entry.bullets.length >= limits.bullets}
        onClick={() => onChange({ bullets: [...entry.bullets, { id: crypto.randomUUID(), text: '' }] })}>Add bullet point</AddButton>
    </fieldset>
  )
}

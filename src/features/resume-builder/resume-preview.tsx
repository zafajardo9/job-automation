import { FileText } from 'lucide-react'
import { publicLink } from '~/features/roles/job-input'
import { resumeFonts, type DraftEntry, type ResumeDraft } from './draft'

const hasText = (text: string) => Boolean(text.trim())

function hasEntry(entry: DraftEntry) {
  return [entry.title, entry.organization, entry.dates, entry.description].some(hasText)
    || entry.bullets.some(({ text }) => hasText(text))
}

export function hasResumeContent(draft: ResumeDraft) {
  return [draft.name, draft.headline, draft.email, draft.phone, draft.location].some(hasText)
    || draft.links.some(({ url }) => hasText(url))
    || draft.sections.some(({ entries }) => entries.some(hasEntry))
}

export function ResumePreview({ draft }: { draft: ResumeDraft }) {
  const contact = [draft.email, draft.phone, draft.location].map((value) => value.trim()).filter(Boolean)
  const links = draft.links.filter(({ url }) => hasText(url))
  const sections = draft.sections.map((section) => ({
    ...section, entries: section.entries.filter(hasEntry),
  })).filter(({ entries }) => entries.length > 0)

  return (
    <article className="resume-paper" aria-label="Resume document"
      style={{ fontFamily: resumeFonts[draft.typography.font].family, fontSize: `${draft.typography.size}pt` }}>
      {!hasResumeContent(draft) ? (
        <div className="resume-paper-empty">
          <FileText className="size-8" aria-hidden="true" />
          <p>Your resume preview</p>
          <p>Start typing in the editor to see your resume here.</p>
        </div>
      ) : (
        <>
          {[draft.name, draft.headline].some(hasText) || contact.length > 0 || links.length > 0 ? (
            <header className="resume-document-header">
              {hasText(draft.name) && <h2>{draft.name.trim()}</h2>}
              {hasText(draft.headline) && <p className="resume-document-headline">{draft.headline.trim()}</p>}
              {contact.length > 0 && <p className="resume-document-contact">{contact.join(' · ')}</p>}
              {links.length > 0 && <ul className="resume-document-links">
                {links.map(({ id, label, url }) => {
                  const link = publicLink.safeParse(url.trim())
                  const address = url.trim().replace(/^https?:\/\//i, '')
                  const text = label.trim() ? `${label.trim()} · ${address}` : address
                  return <li key={id}>{link.success
                    ? <a href={link.data} target="_blank" rel="noreferrer">{text}</a>
                    : text}</li>
                })}
              </ul>}
            </header>
          ) : null}
          {sections.map((section) => (
            <section key={section.id} className="resume-document-section">
              {hasText(section.title) && <h3>{section.title.trim()}</h3>}
              {section.entries.map((entry) => {
                const metadata = [entry.organization, entry.dates].map((value) => value.trim()).filter(Boolean)
                const bullets = entry.bullets.filter(({ text }) => hasText(text))
                return (
                  <div key={entry.id} className="resume-document-entry">
                    {hasText(entry.title) && <h4>{entry.title.trim()}</h4>}
                    {metadata.length > 0 && <p className="resume-document-meta">{metadata.join(' · ')}</p>}
                    {hasText(entry.description) && <p className="resume-document-prose">{entry.description.trim()}</p>}
                    {bullets.length > 0 && <ul className="resume-document-bullets">
                      {bullets.map(({ id, text }) => <li key={id}>{text.trim()}</li>)}
                    </ul>}
                  </div>
                )
              })}
            </section>
          ))}
        </>
      )}
    </article>
  )
}

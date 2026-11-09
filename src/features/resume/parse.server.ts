import '@tanstack/react-start/server-only'
import { load } from 'cheerio'
import { fromBuffer, type ZipFile } from 'yauzl'

export const maxResumeBytes = 5 * 1024 * 1024
const maxXmlBytes = 2 * 1024 * 1024
const maxTextLength = 30_000

export async function readResumeBody(request: Request) {
  if (!request.body || Number(request.headers.get('content-length')) > maxResumeBytes) {
    throw new Error('Choose a PDF or DOCX up to 5 MB.')
  }
  const chunks: Buffer[] = []
  let length = 0
  const reader = request.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxResumeBytes) {
        void reader.cancel().catch(() => {})
        throw new Error('Choose a PDF or DOCX up to 5 MB.')
      }
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks, length)
}

async function readDocumentXml(buffer: Buffer) {
  const zip = await new Promise<ZipFile>((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, file) => {
      if (error || !file) reject(error ?? new Error('Invalid DOCX.'))
      else resolve(file)
    })
  })
  try {
    if (zip.entryCount > 1_024) throw new Error('Too many DOCX entries.')
    return await new Promise<string>((resolve, reject) => {
      zip.on('error', reject)
      zip.once('end', () => reject(new Error('DOCX document text is missing.')))
      zip.on('entry', (entry) => {
        if (entry.fileName !== 'word/document.xml') {
          zip.readEntry()
          return
        }
        if (entry.uncompressedSize > maxXmlBytes) {
          reject(new Error('DOCX text is too large.'))
          return
        }
        zip.openReadStream(entry, async (error, stream) => {
          if (error || !stream) {
            reject(error ?? new Error('DOCX text is unreadable.'))
            return
          }
          try {
            const chunks: Buffer[] = []
            let total = 0
            for await (const chunk of stream) {
              total += chunk.length
              if (total > maxXmlBytes) throw new Error('DOCX text is too large.')
              chunks.push(chunk)
            }
            resolve(Buffer.concat(chunks).toString('utf8'))
          } catch (error) {
            reject(error)
          }
        })
      })
      zip.readEntry()
    })
  } finally {
    zip.close()
  }
}

async function pdfText(bytes: Buffer) {
  const { PDFParse } = await import('pdf-parse')
  const pdf = new PDFParse({ data: bytes, isEvalSupported: false })
  try {
    const result = await pdf.getText({ first: 30 })
    if (result.total > 30) throw new Error('PDF has too many pages.')
    return result.pages.map((page) => page.text).join('\n')
  } finally {
    await pdf.destroy()
  }
}

async function docxText(bytes: Buffer) {
  const xml = await readDocumentXml(bytes)
  const $ = load(xml, { xml: true }, false)
  return $('w\\:p').toArray().map((paragraph) => $(paragraph).find('w\\:t, w\\:tab, w\\:br')
    .toArray().map((node) => {
      if (node.name === 'w:tab') return ' '
      if (node.name === 'w:br') return '\n'
      return $(node).text()
    }).join('')).join('\n')
}

export async function extractResume(bytes: Buffer, filename: string) {
  const lower = filename.toLowerCase()
  let text: string
  if (lower.endsWith('.pdf') && bytes.subarray(0, 5).toString() === '%PDF-') {
    text = await pdfText(bytes)
  } else if (lower.endsWith('.docx') && bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 3, 4]))) {
    text = await docxText(bytes)
  } else {
    throw new Error('Choose a text-based PDF or DOCX.')
  }

  const content = text.replaceAll('\u0000', '').trim()
  if (!/[\p{L}\p{N}]/u.test(content) || content.length > maxTextLength) {
    throw new Error('The resume text is missing or too large.')
  }
  return content
}

// Document types and functions

export interface Brief {
  language?: string
  audience?: string
  tone?: string
  format?: string
  length?: string
  notes?: string
}

export interface Section {
  id: string
  title: string
  content: string
  order: number
  status: 'empty' | 'draft' | 'final'
}

export interface Version {
  id: string
  timestamp: string
  label?: string
  snapshot: string
}

export interface Metadata {
  createdAt: string
  updatedAt: string
  wordCount: number
  status: 'draft' | 'final'
}

export interface Document {
  id: string
  title: string
  brief: Brief
  sections: Section[]
  versions: Version[]
  metadata: Metadata
}

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

export function createSection(title: string, content: string, order: number): Section {
  return {
    id: generateId('sec'),
    title,
    content,
    order,
    status: content ? 'draft' : 'empty'
  }
}

export function createDocument(title: string, brief: Brief, sections: Section[]): Document {
  const now = new Date().toISOString()
  return {
    id: generateId('doc'),
    title,
    brief,
    sections,
    versions: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      wordCount: sections.reduce((sum, s) => sum + s.content.length, 0),
      status: 'draft'
    }
  }
}

export function createVersion(doc: Document, label?: string): Version {
  return {
    id: generateId('ver'),
    timestamp: new Date().toISOString(),
    label,
    snapshot: JSON.stringify(doc)
  }
}

export function touchDocument(doc: Document): void {
  doc.metadata.updatedAt = new Date().toISOString()
  doc.metadata.wordCount = doc.sections.reduce((sum, s) => sum + s.content.length, 0)
}

export function snapshotDocument(doc: Document): string {
  return doc.sections.map(s => s.content).join('\n\n')
}

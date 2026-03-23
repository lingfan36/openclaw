// Workspace for managing documents in memory

import type { Document } from './document.js'

class Workspace {
  private documents = new Map<string, Document>()

  set(doc: Document): void {
    this.documents.set(doc.id, doc)
  }

  get(id: string): Document | undefined {
    return this.documents.get(id)
  }

  list(): Document[] {
    return Array.from(this.documents.values())
  }

  delete(id: string): boolean {
    return this.documents.delete(id)
  }
}

export const workspace = new Workspace()

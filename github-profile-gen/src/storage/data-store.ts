import * as fs from 'fs/promises'
import * as path from 'path'

export interface DataFile<T> {
  lastUpdated: string
  items: T[]
}

export interface MergeResult<T> {
  added: T[]
  existing: T[]
  all: T[]
}

export class DataStore<T extends { id: string }> {
  constructor(
    private filePath: string,
    private idKey: keyof T = 'id' as keyof T
  ) {}

  async load(): Promise<DataFile<T>> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(content) as DataFile<T>
    } catch {
      // File doesn't exist or is invalid, return empty
      return {
        lastUpdated: new Date().toISOString(),
        items: [],
      }
    }
  }

  async save(data: DataFile<T>): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath)
    await fs.mkdir(dir, { recursive: true })

    // Write with pretty formatting
    const content = JSON.stringify(data, null, 2)
    await fs.writeFile(this.filePath, content, 'utf-8')
  }

  async merge(newItems: T[]): Promise<MergeResult<T>> {
    const existing = await this.load()
    const existingIds = new Set(existing.items.map((item) => String(item[this.idKey])))

    const added: T[] = []
    const existingItems: T[] = []

    for (const item of newItems) {
      const id = String(item[this.idKey])
      if (existingIds.has(id)) {
        existingItems.push(item)
      } else {
        added.push(item)
      }
    }

    // Combine: new items first, then existing (sorted by id for consistency)
    const all = [...added, ...existing.items]

    // Update and save
    const updatedData: DataFile<T> = {
      lastUpdated: new Date().toISOString(),
      items: all,
    }
    await this.save(updatedData)

    return {
      added,
      existing: existingItems,
      all,
    }
  }

  async upsert(newItems: T[]): Promise<MergeResult<T>> {
    const existing = await this.load()
    const existingMap = new Map(existing.items.map((item) => [String(item[this.idKey]), item]))

    const added: T[] = []
    const updated: T[] = []

    for (const item of newItems) {
      const id = String(item[this.idKey])
      if (existingMap.has(id)) {
        updated.push(item)
        existingMap.set(id, item) // Update existing
      } else {
        added.push(item)
        existingMap.set(id, item)
      }
    }

    const all = Array.from(existingMap.values())

    const updatedData: DataFile<T> = {
      lastUpdated: new Date().toISOString(),
      items: all,
    }
    await this.save(updatedData)

    return {
      added,
      existing: updated,
      all,
    }
  }
}

// Specialized store for non-cumulative data (e.g., releases, recent work)
export class SnapshotStore<T> {
  constructor(private filePath: string) {}

  async load(): Promise<DataFile<T>> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8')
      return JSON.parse(content) as DataFile<T>
    } catch {
      return {
        lastUpdated: new Date().toISOString(),
        items: [],
      }
    }
  }

  async save(items: T[]): Promise<void> {
    const dir = path.dirname(this.filePath)
    await fs.mkdir(dir, { recursive: true })

    const data: DataFile<T> = {
      lastUpdated: new Date().toISOString(),
      items,
    }

    const content = JSON.stringify(data, null, 2)
    await fs.writeFile(this.filePath, content, 'utf-8')
  }
}

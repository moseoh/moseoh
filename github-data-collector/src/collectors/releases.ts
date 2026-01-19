import { GitHubClient } from '../github'
import { DataStore } from '../storage'
import type { ReleaseItem, ReleasesData, ReleasesCollectorConfig } from '../types'

export interface ReleasesCollectorOptions {
  username: string
  dataPath: string
  config: ReleasesCollectorConfig
}

export class ReleasesCollector {
  private client: GitHubClient
  private store: DataStore<ReleaseItem>
  private options: ReleasesCollectorOptions

  constructor(token: string, options: ReleasesCollectorOptions) {
    this.client = new GitHubClient(token)
    this.store = new DataStore<ReleaseItem>(options.dataPath)
    this.options = options
  }

  async collect(): Promise<{
    added: ReleaseItem[]
    total: number
    data: ReleasesData
  }> {
    const { username, config } = this.options
    const now = new Date().toISOString()

    // Load existing data
    const existingData = await this.store.load()
    const existingItems = existingData.items
    const existingReleases = new Map(
      existingItems.map((item) => [item.id, item.release.publishedAt])
    )

    // Find oldest saved release date
    const oldestSavedDate =
      existingItems.length > 0
        ? new Date(
            Math.min(...existingItems.map((item) => new Date(item.release.publishedAt).getTime()))
          )
        : null

    // Calculate target date: min(oldestSavedDate, sinceDate) or default to 1 year ago
    const sinceDate = config.sinceDate
      ? new Date(config.sinceDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    const targetDate = oldestSavedDate
      ? new Date(Math.min(oldestSavedDate.getTime(), sinceDate.getTime()))
      : sinceDate

    // Fetch releases with pagination until target date
    const releases = await this.client.getReleasesUntil(username, targetDate, existingReleases)

    // Convert to ReleaseItem format
    const newItems: ReleaseItem[] = releases.map((item) => ({
      id: item.repo.nameWithOwner,
      repo: item.repo,
      release: item.release,
      collectedAt: now,
    }))

    // Merge with existing data (cumulative)
    // For releases, we update if same repo has a newer release
    const result = await this.store.upsert(newItems)

    // Sort by release date (newest first)
    const sortedItems = result.all.sort((a, b) => {
      return new Date(b.release.publishedAt).getTime() - new Date(a.release.publishedAt).getTime()
    })

    return {
      added: result.added,
      total: sortedItems.length,
      data: {
        lastUpdated: now,
        items: sortedItems,
      },
    }
  }
}

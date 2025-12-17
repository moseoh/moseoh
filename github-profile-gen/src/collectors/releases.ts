import { GitHubClient } from '../github'
import { SnapshotStore } from '../storage'
import type { ReleaseItem, ReleasesData, CollectorConfig } from '../types'

export interface ReleasesCollectorOptions {
  username: string
  dataPath: string
  config: CollectorConfig
}

export class ReleasesCollector {
  private client: GitHubClient
  private store: SnapshotStore<ReleaseItem>
  private options: ReleasesCollectorOptions

  constructor(token: string, options: ReleasesCollectorOptions) {
    this.client = new GitHubClient(token)
    this.store = new SnapshotStore<ReleaseItem>(options.dataPath)
    this.options = options
  }

  async collect(): Promise<{
    items: ReleaseItem[]
    data: ReleasesData
  }> {
    const { username, config } = this.options
    const excludeRepos = new Set(config.exclude?.repos ?? [])

    // Fetch recent releases from contributed repos
    const releases = await this.client.getRecentReleases(username, config.apiLimit ?? 15)

    // Filter excluded repos
    const filteredReleases = releases.filter((item) => {
      if (excludeRepos.has(item.repo.name) || excludeRepos.has(item.repo.nameWithOwner)) {
        return false
      }
      return true
    })

    // Convert to ReleaseItem format
    const now = new Date().toISOString()
    const items: ReleaseItem[] = filteredReleases.map((item) => ({
      id: item.repo.nameWithOwner,
      repo: item.repo,
      release: item.release,
      collectedAt: now,
    }))

    // Sort by release date (newest first)
    const sortedItems = items.sort((a, b) => {
      return new Date(b.release.publishedAt).getTime() - new Date(a.release.publishedAt).getTime()
    })

    // Save (snapshot - replace all)
    await this.store.save(sortedItems)

    return {
      items: sortedItems,
      data: {
        lastUpdated: now,
        items: sortedItems,
      },
    }
  }
}

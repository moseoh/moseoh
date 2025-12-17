import { GitHubClient } from '../github'
import { SnapshotStore } from '../storage'
import type { RecentWorkItem, RecentWorkData, CollectorConfig } from '../types'

export interface RecentWorkCollectorOptions {
  username: string
  dataPath: string
  config: CollectorConfig
}

export class RecentWorkCollector {
  private client: GitHubClient
  private store: SnapshotStore<RecentWorkItem>
  private options: RecentWorkCollectorOptions

  constructor(token: string, options: RecentWorkCollectorOptions) {
    this.client = new GitHubClient(token)
    this.store = new SnapshotStore<RecentWorkItem>(options.dataPath)
    this.options = options
  }

  async collect(): Promise<{
    items: RecentWorkItem[]
    data: RecentWorkData
  }> {
    const { username, config } = this.options
    const excludeRepos = new Set(config.exclude?.repos ?? [])

    // Fetch recently pushed repos
    const repos = await this.client.getRecentRepos(username, config.apiLimit ?? 10)

    // Filter excluded repos
    const filteredRepos = repos.filter((item) => {
      if (excludeRepos.has(item.repo.name) || excludeRepos.has(item.repo.nameWithOwner)) {
        return false
      }
      return true
    })

    // Convert to RecentWorkItem format
    const now = new Date().toISOString()
    const items: RecentWorkItem[] = filteredRepos.map((item) => ({
      id: item.repo.nameWithOwner,
      repo: item.repo,
      pushedAt: item.pushedAt,
      collectedAt: now,
    }))

    // Already sorted by pushedAt from API
    await this.store.save(items)

    return {
      items,
      data: {
        lastUpdated: now,
        items,
      },
    }
  }
}

import { GitHubClient } from '../github'
import { DataStore } from '../storage'
import type { Contribution, ContributionsData, CollectorConfig } from '../types'

export interface ContributionsCollectorOptions {
  username: string
  dataPath: string
  config: CollectorConfig
}

export class ContributionsCollector {
  private client: GitHubClient
  private store: DataStore<Contribution>
  private options: ContributionsCollectorOptions

  constructor(token: string, options: ContributionsCollectorOptions) {
    this.client = new GitHubClient(token)
    this.store = new DataStore<Contribution>(options.dataPath)
    this.options = options
  }

  async collect(): Promise<{
    added: Contribution[]
    total: number
    data: ContributionsData
  }> {
    const { username, config } = this.options
    const excludeOwners = new Set(config.exclude?.owners ?? [])
    const excludeRepos = new Set(config.exclude?.repos ?? [])

    // Fetch merged PRs from GitHub
    const prs = await this.client.getMergedPullRequests(username, config.apiLimit ?? 99)

    // Filter external contributions (exclude own repos/orgs)
    const externalPRs = prs.filter((item) => {
      // Skip if owner is in exclude list
      if (excludeOwners.has(item.repo.owner)) {
        return false
      }
      // Skip if repo is in exclude list
      if (excludeRepos.has(item.repo.name) || excludeRepos.has(item.repo.nameWithOwner)) {
        return false
      }
      return true
    })

    // Convert to Contribution format
    const now = new Date().toISOString()
    const contributions: Contribution[] = externalPRs.map((item) => ({
      id: `${item.repo.nameWithOwner}#${item.pr.number}`,
      repo: item.repo,
      pr: item.pr,
      collectedAt: now,
    }))

    // Merge with existing data (cumulative)
    const result = await this.store.merge(contributions)

    // Sort by merge date (newest first)
    const sortedItems = result.all.sort((a, b) => {
      const dateA = a.pr.mergedAt ?? a.pr.createdAt
      const dateB = b.pr.mergedAt ?? b.pr.createdAt
      return new Date(dateB).getTime() - new Date(dateA).getTime()
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

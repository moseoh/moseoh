import { GitHubClient } from '../github'
import { DataStore } from '../storage'
import type { Contribution, ContributionsData, ContributionsCollectorConfig } from '../types'

export interface ContributionsCollectorOptions {
  username: string
  dataPath: string
  config: ContributionsCollectorConfig
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
    const now = new Date().toISOString()

    // Load existing data
    const existingData = await this.store.load()
    const existingItems = existingData.items
    const existingIds = new Set(existingItems.map((item) => item.id))

    // Find oldest saved date
    const oldestSavedDate =
      existingItems.length > 0
        ? new Date(
            Math.min(
              ...existingItems.map((item) =>
                new Date(item.pr.mergedAt || item.pr.createdAt).getTime()
              )
            )
          )
        : null

    // Calculate target date: min(oldestSavedDate, sinceDate) or default to 1 year ago
    const sinceDate = config.sinceDate
      ? new Date(config.sinceDate)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    const targetDate = oldestSavedDate
      ? new Date(Math.min(oldestSavedDate.getTime(), sinceDate.getTime()))
      : sinceDate

    // Fetch PRs with pagination until target date
    const prs = await this.client.getMergedPullRequestsUntil(username, targetDate, existingIds)

    // Convert to Contribution format
    const contributions: Contribution[] = prs.map((item) => ({
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

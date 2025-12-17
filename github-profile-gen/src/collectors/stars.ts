import * as fs from 'fs/promises'
import * as path from 'path'
import { GitHubClient } from '../github'
import type { StarsData, StarredRepository, StarsCollectorConfig } from '../types'

export interface StarsCollectorOptions {
  username: string
  dataPath: string
  config: StarsCollectorConfig
}

export class StarsCollector {
  private client: GitHubClient
  private options: StarsCollectorOptions

  constructor(token: string, options: StarsCollectorOptions) {
    this.client = new GitHubClient(token)
    this.options = options
  }

  private async loadExisting(): Promise<StarsData> {
    try {
      const content = await fs.readFile(this.options.dataPath, 'utf-8')
      return JSON.parse(content) as StarsData
    } catch {
      return {
        lastUpdated: new Date().toISOString(),
        totalStars: 0,
        repositories: [],
      }
    }
  }

  private async save(data: StarsData): Promise<void> {
    const dir = path.dirname(this.options.dataPath)
    await fs.mkdir(dir, { recursive: true })
    const content = JSON.stringify(data, null, 2)
    await fs.writeFile(this.options.dataPath, content, 'utf-8')
  }

  async collect(): Promise<{
    totalStars: number
    data: StarsData
  }> {
    const { username, config } = this.options
    const trackHistory = config.trackHistory ?? true

    // Fetch current star counts
    const repos = await this.client.getUserReposStars(username, config.apiLimit ?? 100)

    // Calculate total stars
    const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0)

    // Load existing data for history
    const existing = await this.loadExisting()
    const existingMap = new Map(existing.repositories.map((r) => [r.nameWithOwner, r]))

    const now = new Date().toISOString()
    const today = now.split('T')[0] // YYYY-MM-DD

    // Build updated repositories list
    const repositories: StarredRepository[] = repos.map((repo) => {
      const existingRepo = existingMap.get(repo.nameWithOwner)
      const history = existingRepo?.history ?? []

      // Add today's entry if tracking history and stars changed
      if (trackHistory) {
        const lastEntry = history[history.length - 1]
        if (!lastEntry || lastEntry.stars !== repo.stars) {
          history.push({
            date: today!,
            stars: repo.stars,
          })
        }
      }

      return {
        nameWithOwner: repo.nameWithOwner,
        url: repo.url,
        description: repo.description,
        stars: repo.stars,
        history,
      }
    })

    // Sort by stars (descending)
    repositories.sort((a, b) => b.stars - a.stars)

    const data: StarsData = {
      lastUpdated: now,
      totalStars,
      repositories,
    }

    await this.save(data)

    return {
      totalStars,
      data,
    }
  }
}

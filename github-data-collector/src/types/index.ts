// ===== Repository Types =====
export interface Repository {
  owner: string
  name: string
  nameWithOwner: string
  url: string
  description: string | null
  stars: number
  language: string | null
  topics: string[]
  isPrivate: boolean
}

// ===== Contribution Types =====
export interface PullRequest {
  number: number
  title: string
  url: string
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  mergedAt: string | null
  createdAt: string
  additions: number
  deletions: number
  changedFiles: number
}

export interface Contribution {
  id: string // format: "owner/repo#prNumber"
  repo: Repository
  pr: PullRequest
  collectedAt: string
}

export interface ContributionsData {
  lastUpdated: string
  items: Contribution[]
}

// ===== Release Types =====
export interface Release {
  tagName: string
  name: string | null
  url: string
  publishedAt: string
  isPrerelease: boolean
}

export interface ReleaseItem {
  id: string // format: "owner/repo"
  repo: Repository
  release: Release
  collectedAt: string
}

export interface ReleasesData {
  lastUpdated: string
  items: ReleaseItem[]
}

// ===== Recent Work Types =====
export interface RecentWorkItem {
  id: string
  repo: Repository
  pushedAt: string
  collectedAt: string
}

export interface RecentWorkData {
  lastUpdated: string
  items: RecentWorkItem[]
}

// ===== Stars Types =====
export interface StarHistoryEntry {
  date: string
  stars: number
}

export interface StarredRepository {
  nameWithOwner: string
  url: string
  description: string | null
  stars: number
  history: StarHistoryEntry[]
}

export interface StarsData {
  lastUpdated: string
  totalStars: number
  repositories: StarredRepository[]
}

// ===== RSS Types =====
export interface RssItem {
  id: string
  title: string
  url: string
  publishedAt: string
}

export interface RssFeed {
  url: string
  items: RssItem[]
}

export interface RssData {
  lastUpdated: string
  feeds: Record<string, RssFeed>
}

// ===== Config Types =====
export interface CollectorConfig {
  enabled: boolean
  apiLimit?: number
}

export interface ContributionsCollectorConfig {
  enabled: boolean
  sinceDate?: string // ISO date string (e.g., "2024-01-01")
}

export interface ReleasesCollectorConfig {
  enabled: boolean
  sinceDate?: string // ISO date string (e.g., "2024-01-01")
}

export interface RssCollectorConfig extends CollectorConfig {
  feeds?: Array<{
    name: string
    url: string
    limit?: number
  }>
}

export interface StarsCollectorConfig extends CollectorConfig {
  trackHistory?: boolean
}

export interface Config {
  collectors: {
    contributions: ContributionsCollectorConfig
    releases: ReleasesCollectorConfig
    recentWork: CollectorConfig
    stars: StarsCollectorConfig
    rss: RssCollectorConfig
  }
  paths: {
    template: string
    output: string
    data: string
  }
}

// ===== Template Data =====
export interface TemplateData {
  contributions: Contribution[]
  releases: ReleaseItem[]
  recentWork: RecentWorkItem[]
  stars: StarsData
  rss: RssData
}

// ===== Collector Interface =====
export interface Collector<T> {
  name: string
  collect(): Promise<T[]>
}

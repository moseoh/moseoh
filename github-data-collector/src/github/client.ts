import { graphql } from '@octokit/graphql'
import type { Repository, PullRequest, Release } from '../types'
import {
  MERGED_PULL_REQUESTS_QUERY,
  RECENT_RELEASES_QUERY,
  RECENT_REPOS_QUERY,
  USER_REPOS_STARS_QUERY,
} from './queries'

// ===== GraphQL Response Types =====
interface GqlRepository {
  owner: { login: string }
  name: string
  nameWithOwner: string
  url: string
  description: string | null
  stargazerCount: number
  primaryLanguage: { name: string } | null
  repositoryTopics?: { nodes: Array<{ topic: { name: string } }> }
  isPrivate: boolean
  pushedAt?: string
  releases?: {
    nodes: Array<{
      tagName: string
      name: string | null
      url: string
      publishedAt: string
      isPrerelease: boolean
    }>
  }
}

interface GqlPullRequest {
  number: number
  title: string
  url: string
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  mergedAt: string | null
  createdAt: string
  additions: number
  deletions: number
  changedFiles: number
  repository: GqlRepository
}

interface MergedPRsResponse {
  user: {
    pullRequests: {
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
      nodes: GqlPullRequest[]
    }
  }
}

interface RecentReleasesResponse {
  user: {
    repositoriesContributedTo: {
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
      nodes: GqlRepository[]
    }
  }
}

interface RecentReposResponse {
  user: {
    repositories: {
      nodes: GqlRepository[]
    }
  }
}

interface UserReposStarsResponse {
  user: {
    repositories: {
      nodes: Array<{
        nameWithOwner: string
        url: string
        description: string | null
        stargazerCount: number
        isPrivate: boolean
      }>
    }
  }
}

// ===== Helper Functions =====
function mapRepository(repo: GqlRepository): Repository {
  return {
    owner: repo.owner.login,
    name: repo.name,
    nameWithOwner: repo.nameWithOwner,
    url: repo.url,
    description: repo.description,
    stars: repo.stargazerCount,
    language: repo.primaryLanguage?.name ?? null,
    topics: repo.repositoryTopics?.nodes.map((n) => n.topic.name) ?? [],
    isPrivate: repo.isPrivate,
  }
}

function mapPullRequest(pr: GqlPullRequest): PullRequest {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: pr.state,
    mergedAt: pr.mergedAt,
    createdAt: pr.createdAt,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
  }
}

function mapRelease(
  release: NonNullable<GqlRepository['releases']>['nodes'][number]
): Release {
  return {
    tagName: release.tagName,
    name: release.name,
    url: release.url,
    publishedAt: release.publishedAt,
    isPrerelease: release.isPrerelease,
  }
}

// ===== GitHub Client =====
export class GitHubClient {
  private client: typeof graphql

  constructor(token: string) {
    this.client = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    })
  }

  async getMergedPullRequestsUntil(
    username: string,
    untilDate: Date,
    existingIds: Set<string>
  ): Promise<Array<{ repo: Repository; pr: PullRequest }>> {
    const results: Array<{ repo: Repository; pr: PullRequest }> = []
    let cursor: string | null = null
    let hasNextPage = true

    while (hasNextPage) {
      const response: MergedPRsResponse = await this.client<MergedPRsResponse>(
        MERGED_PULL_REQUESTS_QUERY,
        {
          username,
          limit: 100,
          cursor,
        }
      )

      const pageInfo = response.user.pullRequests.pageInfo
      const prs = response.user.pullRequests.nodes

      for (const pr of prs) {
        // Skip private repos
        if (pr.repository.isPrivate) continue

        // Skip own repos (only include contributions to other repos)
        if (pr.repository.owner.login.toLowerCase() === username.toLowerCase()) continue

        const prDate = new Date(pr.mergedAt || pr.createdAt)

        // Stop if we've reached the target date
        if (prDate < untilDate) {
          hasNextPage = false
          break
        }

        // Skip if already exists
        const prId = `${pr.repository.nameWithOwner}#${pr.number}`
        if (existingIds.has(prId)) continue

        results.push({
          repo: mapRepository(pr.repository),
          pr: mapPullRequest(pr),
        })
      }

      // Check for more pages
      if (hasNextPage) {
        hasNextPage = pageInfo.hasNextPage
        cursor = pageInfo.endCursor
      }
    }

    return results
  }

  async getReleasesUntil(
    username: string,
    untilDate: Date,
    existingReleases: Map<string, string> // repoId → publishedAt (ISO string)
  ): Promise<Array<{ repo: Repository; release: Release }>> {
    const results: Array<{ repo: Repository; release: Release }> = []
    let cursor: string | null = null
    let hasNextPage = true

    while (hasNextPage) {
      const response: RecentReleasesResponse = await this.client<RecentReleasesResponse>(
        RECENT_RELEASES_QUERY,
        {
          username,
          limit: 100,
          cursor,
        }
      )

      const pageInfo = response.user.repositoriesContributedTo.pageInfo
      const repos = response.user.repositoriesContributedTo.nodes

      for (const repo of repos) {
        // Skip private repos or repos without releases
        if (repo.isPrivate || !repo.releases?.nodes.length) continue

        const release = repo.releases.nodes[0]!
        const releaseDate = new Date(release.publishedAt)

        // Stop if release is older than target date
        if (releaseDate < untilDate) {
          // Continue checking other repos in this page, but mark to stop after
          continue
        }

        // Skip if repo already has this or newer release
        const repoId = repo.nameWithOwner
        const existingPublishedAt = existingReleases.get(repoId)
        if (existingPublishedAt && releaseDate <= new Date(existingPublishedAt)) continue

        results.push({
          repo: mapRepository(repo),
          release: mapRelease(release),
        })
      }

      // Check for more pages
      hasNextPage = pageInfo.hasNextPage
      cursor = pageInfo.endCursor

      // If all releases in this page are older than untilDate, stop
      const allOlderThanTarget = repos.every((repo) => {
        if (!repo.releases?.nodes.length) return true
        const releaseDate = new Date(repo.releases.nodes[0]!.publishedAt)
        return releaseDate < untilDate
      })
      if (allOlderThanTarget) {
        hasNextPage = false
      }
    }

    return results
  }

  async getRecentRepos(
    username: string,
    limit: number = 10
  ): Promise<Array<{ repo: Repository; pushedAt: string }>> {
    const response = await this.client<RecentReposResponse>(RECENT_REPOS_QUERY, {
      username,
      limit: Math.min(limit, 100),
    })

    return response.user.repositories.nodes
      .filter((repo) => !repo.isPrivate && repo.pushedAt)
      .map((repo) => ({
        repo: mapRepository(repo),
        pushedAt: repo.pushedAt!,
      }))
  }

  async getUserReposStars(
    username: string,
    limit: number = 100
  ): Promise<
    Array<{
      nameWithOwner: string
      url: string
      description: string | null
      stars: number
    }>
  > {
    const response = await this.client<UserReposStarsResponse>(USER_REPOS_STARS_QUERY, {
      username,
      limit: Math.min(limit, 100),
    })

    return response.user.repositories.nodes
      .filter((repo) => !repo.isPrivate)
      .map((repo) => ({
        nameWithOwner: repo.nameWithOwner,
        url: repo.url,
        description: repo.description,
        stars: repo.stargazerCount,
      }))
  }
}

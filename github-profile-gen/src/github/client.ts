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
      nodes: GqlPullRequest[]
    }
  }
}

interface RecentReleasesResponse {
  user: {
    repositoriesContributedTo: {
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

  async getMergedPullRequests(
    username: string,
    limit: number = 99
  ): Promise<Array<{ repo: Repository; pr: PullRequest }>> {
    const response = await this.client<MergedPRsResponse>(MERGED_PULL_REQUESTS_QUERY, {
      username,
      limit: Math.min(limit, 99), // GitHub API limit
    })

    return response.user.pullRequests.nodes
      .filter((pr) => !pr.repository.isPrivate)
      .map((pr) => ({
        repo: mapRepository(pr.repository),
        pr: mapPullRequest(pr),
      }))
  }

  async getRecentReleases(
    username: string,
    limit: number = 15
  ): Promise<Array<{ repo: Repository; release: Release }>> {
    const response = await this.client<RecentReleasesResponse>(RECENT_RELEASES_QUERY, {
      username,
      limit: Math.min(limit, 100),
    })

    return response.user.repositoriesContributedTo.nodes
      .filter((repo) => !repo.isPrivate && repo.releases?.nodes.length)
      .map((repo) => ({
        repo: mapRepository(repo),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        release: mapRelease(repo.releases!.nodes[0]!),
      }))
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

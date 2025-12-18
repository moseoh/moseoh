export const MERGED_PULL_REQUESTS_QUERY = `
  query($username: String!, $limit: Int!, $cursor: String) {
    user(login: $username) {
      pullRequests(
        first: $limit
        after: $cursor
        states: MERGED
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          number
          title
          url
          state
          mergedAt
          createdAt
          additions
          deletions
          changedFiles
          repository {
            owner {
              login
            }
            name
            nameWithOwner
            url
            description
            stargazerCount
            primaryLanguage {
              name
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
            isPrivate
          }
        }
      }
    }
  }
`

export const RECENT_RELEASES_QUERY = `
  query($username: String!, $limit: Int!, $cursor: String) {
    user(login: $username) {
      repositoriesContributedTo(
        first: $limit
        after: $cursor
        contributionTypes: [COMMIT, PULL_REQUEST]
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          owner {
            login
          }
          name
          nameWithOwner
          url
          description
          stargazerCount
          isPrivate
          releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              tagName
              name
              url
              publishedAt
              isPrerelease
            }
          }
        }
      }
    }
  }
`

export const RECENT_REPOS_QUERY = `
  query($username: String!, $limit: Int!) {
    user(login: $username) {
      repositories(
        first: $limit
        orderBy: { field: PUSHED_AT, direction: DESC }
        ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
      ) {
        nodes {
          owner {
            login
          }
          name
          nameWithOwner
          url
          description
          stargazerCount
          primaryLanguage {
            name
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          isPrivate
          pushedAt
        }
      }
    }
  }
`

export const USER_REPOS_STARS_QUERY = `
  query($username: String!, $limit: Int!) {
    user(login: $username) {
      repositories(
        first: $limit
        ownerAffiliations: [OWNER]
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          url
          description
          stargazerCount
          isPrivate
        }
      }
    }
  }
`

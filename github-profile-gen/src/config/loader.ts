import * as fs from 'fs/promises'
import { parse as parseYaml } from 'yaml'
import type { Config } from '../types'

const DEFAULT_CONFIG: Config = {
  collectors: {
    contributions: {
      enabled: true,
      apiLimit: 99,
      displayLimit: 5,
      exclude: {
        owners: [],
        repos: [],
      },
    },
    releases: {
      enabled: true,
      apiLimit: 15,
      displayLimit: 5,
      exclude: {
        repos: [],
      },
    },
    recentWork: {
      enabled: true,
      apiLimit: 10,
      displayLimit: 5,
      exclude: {
        repos: [],
      },
    },
    stars: {
      enabled: true,
      apiLimit: 100,
      trackHistory: true,
    },
    rss: {
      enabled: false,
      feeds: [],
    },
  },
  paths: {
    template: 'templates/README.md.tpl',
    output: 'README.md',
    data: 'data',
  },
  variables: {},
}

export async function loadConfig(configPath: string): Promise<Config> {
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    const userConfig = parseYaml(content) as Partial<Config>
    return mergeConfig(DEFAULT_CONFIG, userConfig)
  } catch {
    // Config file doesn't exist, use defaults
    return DEFAULT_CONFIG
  }
}

function mergeConfig(defaults: Config, user: Partial<Config>): Config {
  return {
    collectors: {
      contributions: {
        ...defaults.collectors.contributions,
        ...user.collectors?.contributions,
        exclude: {
          ...defaults.collectors.contributions.exclude,
          ...user.collectors?.contributions?.exclude,
        },
      },
      releases: {
        ...defaults.collectors.releases,
        ...user.collectors?.releases,
        exclude: {
          ...defaults.collectors.releases.exclude,
          ...user.collectors?.releases?.exclude,
        },
      },
      recentWork: {
        ...defaults.collectors.recentWork,
        ...user.collectors?.recentWork,
        exclude: {
          ...defaults.collectors.recentWork.exclude,
          ...user.collectors?.recentWork?.exclude,
        },
      },
      stars: {
        ...defaults.collectors.stars,
        ...user.collectors?.stars,
      },
      rss: {
        ...defaults.collectors.rss,
        ...user.collectors?.rss,
      },
    },
    paths: {
      ...defaults.paths,
      ...user.paths,
    },
    variables: {
      ...defaults.variables,
      ...user.variables,
    },
  }
}

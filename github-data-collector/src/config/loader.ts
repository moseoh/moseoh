import * as fs from 'fs/promises'
import { parse as parseYaml } from 'yaml'
import type { Config } from '../types'

const DEFAULT_CONFIG: Config = {
  collectors: {
    contributions: {
      enabled: true,
      // sinceDate is optional, defaults to 1 year ago in collector
    },
    releases: {
      enabled: true,
      // sinceDate is optional, defaults to 1 year ago in collector
    },
    recentWork: {
      enabled: true,
      apiLimit: 10,
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
    template: 'templates/README.md.liquid',
    output: 'README.md',
    data: 'data',
  },
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
      },
      releases: {
        ...defaults.collectors.releases,
        ...user.collectors?.releases,
      },
      recentWork: {
        ...defaults.collectors.recentWork,
        ...user.collectors?.recentWork,
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
  }
}

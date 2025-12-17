import * as fs from 'fs/promises'
import * as path from 'path'
import * as core from '@actions/core'
import { loadConfig } from './config'
import {
  ContributionsCollector,
  ReleasesCollector,
  RecentWorkCollector,
  StarsCollector,
} from './collectors'
import { TemplateEngine } from './renderer'
import type {
  ContributionsData,
  ReleasesData,
  RecentWorkData,
  StarsData,
  RssData,
  TemplateData,
} from './types'

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true })
    const configPath = core.getInput('config-path') || '.github/profile-gen.yml'
    const username = core.getInput('username') || process.env.GITHUB_REPOSITORY_OWNER || ''
    const dryRun = core.getInput('dry-run') === 'true'

    if (!username) {
      throw new Error('Username is required. Set it via input or GITHUB_REPOSITORY_OWNER env.')
    }

    core.info(`Running github-profile-gen for user: ${username}`)

    // Load config
    const config = await loadConfig(configPath)
    core.info(`Config loaded from: ${configPath}`)

    const dataDir = config.paths.data

    // Initialize data
    let contributions: ContributionsData = { lastUpdated: '', items: [] }
    let releases: ReleasesData = { lastUpdated: '', items: [] }
    let recentWork: RecentWorkData = { lastUpdated: '', items: [] }
    let stars: StarsData = { lastUpdated: '', totalStars: 0, repositories: [] }
    const rss: RssData = { lastUpdated: '', feeds: {} }

    // Collect contributions
    if (config.collectors.contributions.enabled) {
      core.info('Collecting contributions...')
      const collector = new ContributionsCollector(token, {
        username,
        dataPath: path.join(dataDir, 'contributions.json'),
        config: config.collectors.contributions,
      })
      const result = await collector.collect()
      contributions = result.data
      core.info(`Contributions: ${result.added.length} new, ${result.total} total`)
    }

    // Collect releases
    if (config.collectors.releases.enabled) {
      core.info('Collecting releases...')
      const collector = new ReleasesCollector(token, {
        username,
        dataPath: path.join(dataDir, 'releases.json'),
        config: config.collectors.releases,
      })
      const result = await collector.collect()
      releases = result.data
      core.info(`Releases: ${result.items.length} items`)
    }

    // Collect recent work
    if (config.collectors.recentWork.enabled) {
      core.info('Collecting recent work...')
      const collector = new RecentWorkCollector(token, {
        username,
        dataPath: path.join(dataDir, 'recent-work.json'),
        config: config.collectors.recentWork,
      })
      const result = await collector.collect()
      recentWork = result.data
      core.info(`Recent work: ${result.items.length} items`)
    }

    // Collect stars
    if (config.collectors.stars.enabled) {
      core.info('Collecting stars...')
      const collector = new StarsCollector(token, {
        username,
        dataPath: path.join(dataDir, 'stars.json'),
        config: config.collectors.stars,
      })
      const result = await collector.collect()
      stars = result.data
      core.info(`Stars: ${result.totalStars} total`)
    }

    // TODO: RSS collector

    // Prepare template data
    const templateData: TemplateData = {
      contributions: contributions.items,
      releases: releases.items,
      recentWork: recentWork.items,
      stars,
      rss,
      config,
      variables: config.variables,
    }

    // Read template
    const templatePath = config.paths.template
    const template = await fs.readFile(templatePath, 'utf-8')
    core.info(`Template loaded from: ${templatePath}`)

    // Render README
    const engine = new TemplateEngine()
    const readme = engine.render(template, templateData as unknown as Record<string, unknown>)

    // Write output
    if (!dryRun) {
      const outputPath = config.paths.output
      await fs.writeFile(outputPath, readme, 'utf-8')
      core.info(`README written to: ${outputPath}`)
    } else {
      core.info('Dry run - README not written')
      core.info('Generated README:')
      core.info(readme)
    }

    // Set outputs
    core.setOutput('readme-path', config.paths.output)
    core.setOutput('new-contributions', contributions.items.length)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

run()

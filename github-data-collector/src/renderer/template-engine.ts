import { Liquid } from 'liquidjs'
import { formatDistanceToNow } from 'date-fns'

export class TemplateEngine {
  private engine: Liquid

  constructor() {
    this.engine = new Liquid({
      strictFilters: false,
      strictVariables: false,
    })
    this.registerFilters()
  }

  private registerFilters(): void {
    // humanize: relative time (e.g., "2 days ago")
    this.engine.registerFilter('humanize', (date: string | Date) => {
      if (!date) return ''
      const d = typeof date === 'string' ? new Date(date) : date
      return formatDistanceToNow(d, { addSuffix: true })
    })
  }

  async render(template: string, data: Record<string, unknown>): Promise<string> {
    return this.engine.parseAndRender(template, data)
  }
}

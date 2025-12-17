import Handlebars from 'handlebars'
import { formatDistanceToNow, format } from 'date-fns'

export class TemplateEngine {
  private handlebars: typeof Handlebars

  constructor() {
    this.handlebars = Handlebars.create()
    this.registerHelpers()
  }

  private registerHelpers(): void {
    // humanize: relative time (e.g., "2 days ago")
    this.handlebars.registerHelper('humanize', (date: string | Date) => {
      if (!date) return ''
      const d = typeof date === 'string' ? new Date(date) : date
      return formatDistanceToNow(d, { addSuffix: true })
    })

    // formatDate: custom date format
    this.handlebars.registerHelper('formatDate', (date: string | Date, formatStr: string) => {
      if (!date) return ''
      const d = typeof date === 'string' ? new Date(date) : date
      return format(d, formatStr || 'yyyy-MM-dd')
    })

    // limit: limit array to n items
    this.handlebars.registerHelper('limit', (array: unknown[], n: number) => {
      if (!Array.isArray(array)) return []
      return array.slice(0, n)
    })

    // includes: check if array includes value
    this.handlebars.registerHelper('includes', (array: unknown[], value: unknown) => {
      if (!Array.isArray(array)) return false
      return array.includes(value)
    })

    // eq: equality check
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)

    // ne: not equal
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b)

    // gt: greater than
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b)

    // lt: less than
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b)

    // gte: greater than or equal
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b)

    // lte: less than or equal
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b)

    // add: addition
    this.handlebars.registerHelper('add', (a: number, b: number) => a + b)

    // subtract: subtraction
    this.handlebars.registerHelper('subtract', (a: number, b: number) => a - b)

    // and: logical and
    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      // Remove options object (last argument)
      const values = args.slice(0, -1)
      return values.every(Boolean)
    })

    // or: logical or
    this.handlebars.registerHelper('or', (...args: unknown[]) => {
      const values = args.slice(0, -1)
      return values.some(Boolean)
    })

    // not: logical not
    this.handlebars.registerHelper('not', (value: unknown) => !value)

    // json: JSON stringify for debugging
    this.handlebars.registerHelper('json', (value: unknown) => {
      return JSON.stringify(value, null, 2)
    })

    // truncate: truncate string
    this.handlebars.registerHelper('truncate', (str: string, len: number) => {
      if (!str) return ''
      if (str.length <= len) return str
      return str.slice(0, len) + '...'
    })

    // default: provide default value
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) => {
      return value ?? defaultValue
    })

    // times: repeat block n times
    this.handlebars.registerHelper('times', function (n: number, options: Handlebars.HelperOptions) {
      let result = ''
      for (let i = 0; i < n; i++) {
        result += options.fn({ index: i, first: i === 0, last: i === n - 1 })
      }
      return result
    })

    // join: join array with separator
    this.handlebars.registerHelper('join', (array: unknown[], separator: string) => {
      if (!Array.isArray(array)) return ''
      return array.join(separator || ', ')
    })

    // sortBy: sort array by key
    this.handlebars.registerHelper('sortBy', (array: unknown[], key: string, order: string) => {
      if (!Array.isArray(array)) return []
      const sorted = [...array].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[key]
        const bVal = (b as Record<string, unknown>)[key]
        if (aVal === bVal) return 0
        if (aVal === undefined || aVal === null) return 1
        if (bVal === undefined || bVal === null) return -1
        return String(aVal) < String(bVal) ? -1 : 1
      })
      return order === 'desc' ? sorted.reverse() : sorted
    })

    // filter: filter array by condition
    this.handlebars.registerHelper('filter', (array: unknown[], key: string, value: unknown) => {
      if (!Array.isArray(array)) return []
      return array.filter((item) => (item as Record<string, unknown>)[key] === value)
    })

    // first: get first element
    this.handlebars.registerHelper('first', (array: unknown[]) => {
      if (!Array.isArray(array) || array.length === 0) return undefined
      return array[0]
    })

    // last: get last element
    this.handlebars.registerHelper('last', (array: unknown[]) => {
      if (!Array.isArray(array) || array.length === 0) return undefined
      return array[array.length - 1]
    })

    // count: get array length
    this.handlebars.registerHelper('count', (array: unknown[]) => {
      if (!Array.isArray(array)) return 0
      return array.length
    })
  }

  compile(template: string): Handlebars.TemplateDelegate {
    return this.handlebars.compile(template)
  }

  render(template: string, data: Record<string, unknown>): string {
    const compiled = this.compile(template)
    return compiled(data)
  }
}

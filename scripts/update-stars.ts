#!/usr/bin/env bun
// README.md의 `**[owner/repo](https://github.com/owner/repo)** · ⭐ N` 형식의 스타 수를 갱신한다.
// 사용법: bun scripts/update-stars.ts  (gh CLI 로그인 필요)

const readmePath = new URL('../README.md', import.meta.url).pathname
const pattern = /(\*\*\[([\w.-]+\/[\w.-]+)\]\(https:\/\/github\.com\/\2\)\*\* · ⭐ )([\d.]+k?)/g

function compact(n: number): string {
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
}

function stars(repo: string): number {
  const res = Bun.spawnSync(['gh', 'api', `repos/${repo}`, '--jq', '.stargazers_count'])
  if (res.exitCode !== 0) throw new Error(`gh api repos/${repo} 실패: ${res.stderr.toString()}`)
  return Number(res.stdout.toString().trim())
}

const readme = await Bun.file(readmePath).text()
const updated = readme.replace(pattern, (_match, prefix: string, repo: string, old: string) => {
  const next = compact(stars(repo))
  console.log(`${repo}: ${old} → ${next}`)
  return prefix + next
})

if (updated === readme) {
  console.log('변경 없음')
} else {
  await Bun.write(readmePath, updated)
  console.log('README.md 갱신됨')
}

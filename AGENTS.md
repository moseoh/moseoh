# AGENTS.md

이 문서는 AI 코딩 에이전트(Claude, Copilot 등)가 이 저장소에서 작업할 때 참고할 가이드라인입니다.

## 프로젝트 개요

GitHub 데이터를 수집하여 프로필 README를 자동 생성하는 GitHub Action입니다.

- **언어**: TypeScript
- **런타임**: Node.js 20
- **프레임워크**: GitHub Actions
- **패키지 매니저**: npm
- **빌드 도구**: @vercel/ncc

## 프로젝트 구조

```
moseoh/
├── github-data-collector/     # 메인 패키지 (모든 개발은 여기서)
│   ├── src/
│   │   ├── collectors/        # 데이터 수집기 (contributions, releases, stars, recent-work)
│   │   ├── config/            # 설정 로더
│   │   ├── github/            # GitHub API 클라이언트 (GraphQL)
│   │   ├── renderer/          # Liquid 템플릿 엔진
│   │   ├── storage/           # 데이터 저장소 (JSON 파일)
│   │   ├── types/             # TypeScript 타입 정의
│   │   └── index.ts           # 진입점
│   ├── docs/                  # 내부 문서
│   └── dist/                  # 빌드 결과물 (커밋됨)
├── data/                      # 수집된 데이터 (JSON)
├── templates/                 # Liquid 템플릿
└── .github/
    ├── workflows/readme.yml   # GitHub Actions 워크플로우
    └── profile-gen.yml        # 설정 파일
```

## 빌드/린트/테스트 명령어

**모든 명령어는 `github-data-collector/` 디렉토리에서 실행합니다.**

```bash
cd github-data-collector

# 빌드
npm run build          # ncc로 번들링 → dist/index.js 생성

# 개발
npm run dev            # ts-node로 로컬 실행

# 린트
npm run lint           # ESLint 실행
npm run lint:fix       # ESLint 자동 수정 (Prettier 포함)

# 타입 체크
npm run typecheck      # tsc --noEmit

# 테스트 (아직 미구현)
npm run test           # Jest (테스트 파일 없음)
npm run test -- path/to/file.test.ts  # 단일 테스트 파일 실행

# 정리
npm run clean          # dist/ 폴더 삭제
```

### 단일 테스트 실행

```bash
# 특정 파일
npm run test -- src/collectors/contributions.test.ts

# 패턴 매칭
npm run test -- --testPathPattern="contributions"

# watch 모드
npm run test -- --watch
```

## 코드 스타일 가이드라인

### Prettier 설정

```json
{
  "semi": false,           // 세미콜론 없음
  "singleQuote": true,     // 작은따옴표 사용
  "tabWidth": 2,           // 들여쓰기 2 스페이스
  "trailingComma": "es5",  // ES5 스타일 trailing comma
  "printWidth": 100        // 줄 너비 100자
}
```

### Import 순서 및 규칙

```typescript
// 1. Node.js 내장 모듈
import * as fs from 'fs/promises'
import * as path from 'path'

// 2. 외부 패키지
import * as core from '@actions/core'
import { graphql } from '@octokit/graphql'

// 3. 내부 모듈
import { GitHubClient } from '../github'
import { DataStore } from '../storage'

// 4. 타입 (type 키워드로 분리)
import type { Contribution, ContributionsData } from '../types'
```

### 타입 정의

```typescript
// 인터페이스: interface 키워드 사용
export interface Repository {
  owner: string
  name: string
  nameWithOwner: string
  url: string
  description: string | null  // null 가능한 필드는 명시적으로
  stars: number
  language: string | null
  topics: string[]
  isPrivate: boolean
}

// 유니온 타입
state: 'OPEN' | 'CLOSED' | 'MERGED'

// 제네릭
export interface Collector<T> {
  name: string
  collect(): Promise<T[]>
}
```

### 네이밍 컨벤션

| 대상 | 컨벤션 | 예시 |
|------|--------|------|
| 파일명 | kebab-case | `template-engine.ts`, `data-store.ts` |
| 클래스 | PascalCase | `ContributionsCollector`, `DataStore` |
| 인터페이스 | PascalCase | `Repository`, `PullRequest` |
| 함수/메서드 | camelCase | `getMergedPullRequests()`, `loadConfig()` |
| 변수 | camelCase | `existingItems`, `targetDate` |
| 상수 | camelCase 또는 UPPER_CASE | `now`, `DEFAULT_LIMIT` |
| 타입 파일 | `types/index.ts`에 모아서 관리 | |

### 에러 처리

```typescript
// GitHub Actions에서는 core.setFailed() 사용
try {
  const result = await collector.collect()
} catch (error) {
  if (error instanceof Error) {
    core.setFailed(error.message)
  } else {
    core.setFailed('An unexpected error occurred')
  }
}

// 필수 입력값 검증
if (!username) {
  throw new Error('Username is required. Set it via input or GITHUB_REPOSITORY_OWNER env.')
}
```

### 클래스 패턴

```typescript
export class ContributionsCollector {
  private client: GitHubClient
  private store: DataStore<Contribution>
  private options: ContributionsCollectorOptions

  constructor(token: string, options: ContributionsCollectorOptions) {
    this.client = new GitHubClient(token)
    this.store = new DataStore<Contribution>(options.dataPath)
    this.options = options
  }

  async collect(): Promise<CollectResult> {
    // 구현
  }
}
```

### TypeScript 엄격 모드

`tsconfig.json`에서 다음 옵션이 활성화되어 있습니다:

- `strict: true` - 모든 strict 옵션 활성화
- `noImplicitAny: true` - 암시적 any 금지
- `noImplicitReturns: true` - 모든 코드 경로에서 반환값 필수
- `noFallthroughCasesInSwitch: true` - switch fallthrough 금지
- `noUncheckedIndexedAccess: true` - 인덱스 접근 시 undefined 체크 필수
- `noUnusedLocals: true` - 사용하지 않는 로컬 변수 금지
- `noUnusedParameters: true` - 사용하지 않는 파라미터 금지

### ESLint 규칙

- `@typescript-eslint/no-unused-vars`: `error` (`_`로 시작하는 인자는 허용)
- `@typescript-eslint/no-explicit-any`: `warn`
- `@typescript-eslint/explicit-function-return-type`: `off`

## 주요 의존성

### 프로덕션

- `@actions/core`, `@actions/github` - GitHub Actions SDK
- `@octokit/graphql` - GitHub GraphQL API
- `liquidjs` - 템플릿 엔진
- `date-fns` - 날짜 처리
- `yaml` - YAML 파싱
- `zod` - 스키마 검증 (설치됨, 향후 사용 예정)

### 개발

- `typescript` - TypeScript 5.7
- `@vercel/ncc` - 번들러
- `eslint` + `@typescript-eslint/*` - 린터
- `prettier` - 포매터
- `ts-node` - 개발 실행

## 커밋 전 체크리스트

```bash
cd github-data-collector
npm run lint:fix      # 린트 및 포맷팅 자동 수정
npm run typecheck     # 타입 체크
npm run build         # 빌드 확인 (dist/ 커밋 필요)
```

## 주의사항

1. **dist/ 폴더 커밋 필요**: GitHub Actions는 번들된 `dist/index.js`를 사용합니다. 코드 변경 시 반드시 `npm run build` 후 `dist/` 폴더도 함께 커밋하세요.

2. **세미콜론 없음**: Prettier 설정에 따라 세미콜론을 사용하지 않습니다.

3. **타입 import 분리**: 타입만 가져올 때는 `import type { ... }`을 사용합니다.

4. **null vs undefined**: API 응답에서 null인 필드는 `string | null`로 명시합니다.

5. **문서 언어**: 이 프로젝트의 문서는 한글로 작성합니다.

# Collectors 동작 방식

## 개요

github-data-collector는 GitHub API에서 데이터를 수집하여 JSON 파일에 저장합니다.
각 collector는 `sinceDate` 기반 페이지네이션을 사용하여 지정한 날짜까지의 모든 데이터를 수집합니다.

## Contributions Collector

### 설정

```yaml
collectors:
  contributions:
    enabled: true
    sinceDate: "2024-01-01"  # 이 날짜까지 조회 (선택, 기본: 1년 전)
```

### 동작 방식

1. **데이터 수집**: GitHub GraphQL API로 사용자의 merged PR을 조회
2. **페이지네이션**: 100개씩 페이지를 넘기며 `sinceDate`까지 조회
3. **누적 저장**: 기존 데이터와 병합하여 `data/contributions.json`에 저장
4. **중복 제거**: PR ID 기준으로 중복 방지

### 조회 범위 결정 로직

```
목표 날짜 = min(저장된 가장 오래된 PR 날짜, sinceDate)
오늘 → 목표 날짜까지 조회
```

| 상황 | 저장된 데이터 | sinceDate | 조회 범위 |
|------|-------------|-----------|----------|
| 첫 실행 | 없음 | 2024-01-01 | 오늘 → 2024-01-01 |
| 일반 실행 | 2024-06-01~ | 2024-01-01 | 오늘 → 2024-06-01 |
| sinceDate 변경 | 2024-06-01~ | 2023-01-01 | 오늘 → 2023-01-01 |
| sinceDate 없음 | 없음 | (없음) | 오늘 → 1년 전 |

### 저장 형식

```json
{
  "lastUpdated": "2025-12-18T00:00:00Z",
  "items": [
    {
      "id": "owner/repo#123",
      "repo": { "owner": "...", "name": "...", ... },
      "pr": { "number": 123, "title": "...", "mergedAt": "...", ... },
      "collectedAt": "2025-12-18T00:00:00Z"
    }
  ]
}
```

---

## Releases Collector

### 설정

```yaml
collectors:
  releases:
    enabled: true
    sinceDate: "2024-01-01"  # 이 날짜까지 조회 (선택, 기본: 1년 전)
```

### 동작 방식

1. **데이터 수집**: 사용자가 기여한 repo들의 최신 릴리스 조회
2. **페이지네이션**: `repositoriesContributedTo`를 100개씩 조회
3. **필터링**: 릴리스 날짜가 `sinceDate` 이후인 것만 저장
4. **누적 저장**: repo 단위로 최신 릴리스 유지 (upsert)

### 조회 범위 결정 로직

Contributions와 동일한 로직:

```
목표 날짜 = min(저장된 가장 오래된 릴리스 날짜, sinceDate)
오늘 → 목표 날짜까지 조회
```

### 저장 형식

```json
{
  "lastUpdated": "2025-12-18T00:00:00Z",
  "items": [
    {
      "id": "owner/repo",
      "repo": { "owner": "...", "name": "...", ... },
      "release": { "tagName": "v1.0.0", "publishedAt": "...", ... },
      "collectedAt": "2025-12-18T00:00:00Z"
    }
  ]
}
```

### 주의사항

- 각 repo당 최신 릴리스 1개만 저장
- 같은 repo에서 새 릴리스가 나오면 업데이트됨

---

## Recent Work Collector

### 설정

```yaml
collectors:
  recentWork:
    enabled: true
    apiLimit: 10  # 가져올 repo 개수
```

### 동작 방식

1. **스냅샷 방식**: 매번 최신 데이터로 교체 (누적 X)
2. **정렬 기준**: `pushedAt` (repo의 마지막 push 시간)
3. **용도**: "현재 작업 중인 프로젝트" 표시

### 저장 형식

```json
{
  "lastUpdated": "2025-12-18T00:00:00Z",
  "items": [
    {
      "id": "owner/repo",
      "repo": { ... },
      "pushedAt": "2025-12-17T00:00:00Z",
      "collectedAt": "2025-12-18T00:00:00Z"
    }
  ]
}
```

---

## Stars Collector

### 설정

```yaml
collectors:
  stars:
    enabled: true
    trackHistory: true  # 스타 수 변화 기록 (기본: true)
```

### 동작 방식

1. **스냅샷 방식**: 현재 스타 수 조회
2. **히스토리 기록**: `trackHistory: true`면 스타 수가 변할 때마다 기록
3. **용도**: 총 스타 수 및 스타 증가 추이 표시

### 저장 형식

```json
{
  "lastUpdated": "2025-12-18T00:00:00Z",
  "totalStars": 150,
  "repositories": [
    {
      "nameWithOwner": "owner/repo",
      "stars": 42,
      "history": [
        { "date": "2025-12-01", "stars": 38 },
        { "date": "2025-12-18", "stars": 42 }
      ]
    }
  ]
}
```

---

## Rate Limit 고려사항

- GitHub GraphQL API: 5,000 points/hour
- 요청당 비용: ~1 point
- 100 items/page × 50 pages = 5,000 items 조회 가능
- 대부분의 사용자에게 충분

페이지네이션 사용 시 rate limit에 도달하면 에러가 발생합니다.
`sinceDate`를 너무 과거로 설정하지 않도록 주의하세요.

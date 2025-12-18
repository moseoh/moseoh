# 템플릿 사용법

## 개요

템플릿은 [LiquidJS](https://liquidjs.com/) 문법을 사용합니다.

기본 문법(변수, 반복문, 조건문 등)은 공식 문서를 참고하세요:
- [Liquid 태그](https://liquidjs.com/tags/overview.html) - `for`, `if`, `unless`, `assign` 등
- [Liquid 필터](https://liquidjs.com/filters/overview.html) - `split`, `contains`, `plus` 등

---

## 사용 가능한 데이터

### contributions

오픈소스 기여 (머지된 PR) 목록

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.id` | string | `owner/repo#123` 형식 |
| `item.repo` | Repository | 저장소 정보 |
| `item.pr` | PullRequest | PR 정보 |
| `item.collectedAt` | string | 수집 시간 (ISO 8601) |

**PullRequest 필드:**

| 필드 | 설명 |
|------|------|
| `item.pr.number` | PR 번호 |
| `item.pr.title` | PR 제목 |
| `item.pr.url` | PR URL |
| `item.pr.state` | `OPEN`, `CLOSED`, `MERGED` |
| `item.pr.mergedAt` | 머지 시간 |
| `item.pr.createdAt` | 생성 시간 |
| `item.pr.additions` | 추가된 줄 수 |
| `item.pr.deletions` | 삭제된 줄 수 |
| `item.pr.changedFiles` | 변경된 파일 수 |

---

### releases

기여한 저장소의 릴리스 목록

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.id` | string | `owner/repo` 형식 |
| `item.repo` | Repository | 저장소 정보 |
| `item.release` | Release | 릴리스 정보 |
| `item.collectedAt` | string | 수집 시간 |

**Release 필드:**

| 필드 | 설명 |
|------|------|
| `item.release.tagName` | 태그명 (예: `v1.0.0`) |
| `item.release.name` | 릴리스명 |
| `item.release.url` | 릴리스 URL |
| `item.release.publishedAt` | 배포 시간 |
| `item.release.isPrerelease` | 프리릴리스 여부 |

---

### recentWork

최근 작업한 저장소 목록 (pushedAt 기준)

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.id` | string | `owner/repo` 형식 |
| `item.repo` | Repository | 저장소 정보 |
| `item.pushedAt` | string | 마지막 push 시간 |
| `item.collectedAt` | string | 수집 시간 |

---

### stars

내 저장소들의 스타 정보

| 필드 | 타입 | 설명 |
|------|------|------|
| `stars.totalStars` | number | 총 스타 수 |
| `stars.lastUpdated` | string | 마지막 업데이트 |
| `stars.repositories` | array | 저장소별 스타 정보 |

**Repository 필드:**

| 필드 | 설명 |
|------|------|
| `repo.nameWithOwner` | `owner/repo` 형식 |
| `repo.url` | 저장소 URL |
| `repo.description` | 저장소 설명 |
| `repo.stars` | 현재 스타 수 |
| `repo.history` | 스타 변화 기록 |

---

### 공통: Repository 필드

`item.repo`로 접근 가능한 저장소 정보:

| 필드 | 설명 |
|------|------|
| `repo.owner` | 소유자명 |
| `repo.name` | 저장소명 |
| `repo.nameWithOwner` | `owner/repo` 형식 |
| `repo.url` | 저장소 URL |
| `repo.description` | 저장소 설명 |
| `repo.stars` | 스타 수 |
| `repo.language` | 주 언어 |
| `repo.topics` | 토픽 목록 |
| `repo.isPrivate` | 비공개 여부 |

---

## 커스텀 필터

### humanize

날짜를 상대 시간으로 변환합니다.

```liquid
{{ item.release.publishedAt | humanize }}
```

결과: `3 days ago`, `2 months ago` 등

---

## 예제 템플릿

```liquid
{%- assign excludeOwners = "my-org another-org" | split: " " -%}

### Hi there 👋

#### 🚀 Latest releases I've contributed to
{%- assign releaseCount = 0 -%}
{%- for item in releases -%}
{%- unless excludeOwners contains item.repo.owner -%}
{%- if releaseCount < 5 %}
- [{{ item.repo.nameWithOwner }}]({{ item.repo.url }}) ([{{ item.release.tagName }}]({{ item.release.url }}), {{ item.release.publishedAt | humanize }}){% if item.repo.description %} - {{ item.repo.description }}{% endif %}
{%- assign releaseCount = releaseCount | plus: 1 -%}
{%- endif -%}
{%- endunless -%}
{%- endfor %}

#### 🎉 My merged PRs
{%- assign contribCount = 0 -%}
{%- for item in contributions -%}
{%- unless excludeOwners contains item.repo.owner -%}
{%- if contribCount < 5 %}
- [{{ item.repo.nameWithOwner }}]({{ item.repo.url }}) - [#{{ item.pr.number }}]({{ item.pr.url }}) {{ item.pr.title }}
{%- assign contribCount = contribCount | plus: 1 -%}
{%- endif -%}
{%- endunless -%}
{%- endfor %}

{%- if recentWork.size > 0 %}
#### 👷 Check out what I'm currently working on
{%- for item in recentWork limit:5 %}
- [{{ item.repo.nameWithOwner }}]({{ item.repo.url }}){% if item.repo.description %} - {{ item.repo.description }}{% endif %} ({{ item.pushedAt | humanize }})
{%- endfor %}
{%- endif %}

{%- if stars.totalStars %}
#### ⭐ Total Stars: {{ stars.totalStars }}
{%- endif %}
```

### 참고: 공백 제어

`{%-`와 `-%}`는 태그 앞/뒤의 공백을 제거합니다. 없으면 불필요한 빈 줄이 생깁니다.

### 참고: 필터링 + 개수 제한

`limit:5`는 반복 횟수만 제한합니다. 필터링(`unless`)과 함께 사용하면 원하는 개수가 안 나올 수 있으므로, 카운터 방식을 권장합니다.

# 템플릿 사용법

## 개요

템플릿은 [Liquid](https://liquidjs.com/) 문법을 사용합니다. Liquid는 Jekyll, Shopify 등에서 사용되는 표준 템플릿 엔진입니다.

## 사용 가능한 데이터

### contributions

오픈소스 기여 (머지된 PR) 목록

```liquid
{% for item in contributions %}
- {{ item.repo.nameWithOwner }} - #{{ item.pr.number }}
{% endfor %}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.id` | string | `owner/repo#123` 형식 |
| `item.repo` | Repository | 저장소 정보 |
| `item.pr` | PullRequest | PR 정보 |
| `item.collectedAt` | string | 수집 시간 (ISO 8601) |

**PullRequest 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.pr.number` | number | PR 번호 |
| `item.pr.title` | string | PR 제목 |
| `item.pr.url` | string | PR URL |
| `item.pr.state` | string | `OPEN`, `CLOSED`, `MERGED` |
| `item.pr.mergedAt` | string | 머지 시간 |
| `item.pr.createdAt` | string | 생성 시간 |
| `item.pr.additions` | number | 추가된 줄 수 |
| `item.pr.deletions` | number | 삭제된 줄 수 |
| `item.pr.changedFiles` | number | 변경된 파일 수 |

---

### releases

기여한 저장소의 릴리스 목록

```liquid
{% for item in releases %}
- {{ item.repo.nameWithOwner }} {{ item.release.tagName }}
{% endfor %}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.id` | string | `owner/repo` 형식 |
| `item.repo` | Repository | 저장소 정보 |
| `item.release` | Release | 릴리스 정보 |
| `item.collectedAt` | string | 수집 시간 |

**Release 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.release.tagName` | string | 태그명 (예: `v1.0.0`) |
| `item.release.name` | string | 릴리스명 |
| `item.release.url` | string | 릴리스 URL |
| `item.release.publishedAt` | string | 배포 시간 |
| `item.release.isPrerelease` | boolean | 프리릴리스 여부 |

---

### recentWork

최근 작업한 저장소 목록 (pushedAt 기준)

```liquid
{% for item in recentWork %}
- {{ item.repo.nameWithOwner }} ({{ item.pushedAt | humanize }})
{% endfor %}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `item.id` | string | `owner/repo` 형식 |
| `item.repo` | Repository | 저장소 정보 |
| `item.pushedAt` | string | 마지막 push 시간 |
| `item.collectedAt` | string | 수집 시간 |

---

### stars

내 저장소들의 스타 정보

```liquid
총 스타: {{ stars.totalStars }}

{% for repo in stars.repositories %}
- {{ repo.nameWithOwner }}: {{ repo.stars }}개
{% endfor %}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `stars.totalStars` | number | 총 스타 수 |
| `stars.lastUpdated` | string | 마지막 업데이트 |
| `stars.repositories` | array | 저장소별 스타 정보 |

**Repository 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `repo.nameWithOwner` | string | `owner/repo` 형식 |
| `repo.url` | string | 저장소 URL |
| `repo.description` | string | 저장소 설명 |
| `repo.stars` | number | 현재 스타 수 |
| `repo.history` | array | 스타 변화 기록 |

---

### 공통: Repository 필드

`item.repo`로 접근 가능한 저장소 정보:

| 필드 | 타입 | 설명 |
|------|------|------|
| `repo.owner` | string | 소유자명 |
| `repo.name` | string | 저장소명 |
| `repo.nameWithOwner` | string | `owner/repo` 형식 |
| `repo.url` | string | 저장소 URL |
| `repo.description` | string | 저장소 설명 |
| `repo.stars` | number | 스타 수 |
| `repo.language` | string | 주 언어 |
| `repo.topics` | array | 토픽 목록 |
| `repo.isPrivate` | boolean | 비공개 여부 |

---

## 커스텀 필터

### humanize

날짜를 상대 시간으로 변환합니다.

```liquid
{{ item.release.publishedAt | humanize }}
```

결과: `3 days ago`, `2 months ago` 등

---

## 자주 사용하는 문법

### 변수 선언

```liquid
{% assign myList = "apple orange banana" | split: " " %}
{% assign limit = 5 %}
```

### 반복문

```liquid
{% for item in releases limit:5 %}
- {{ item.repo.nameWithOwner }}
{% endfor %}
```

### 조건문

```liquid
{% if item.repo.description %}
  {{ item.repo.description }}
{% endif %}

{% if stars.totalStars > 100 %}
  스타가 100개 이상입니다!
{% endif %}
```

### 필터링 (unless + contains)

특정 저장소/소유자 제외하기:

```liquid
{% assign excludeRepos = "repo1 repo2" | split: " " %}
{% assign excludeOwners = "owner1 owner2" | split: " " %}

{% for item in releases limit:5 %}
{% unless excludeRepos contains item.repo.name or excludeOwners contains item.repo.owner %}
- {{ item.repo.nameWithOwner }}
{% endunless %}
{% endfor %}
```

### 배열 크기 확인

```liquid
{% if recentWork.size > 0 %}
  데이터가 있습니다.
{% endif %}
```

### 링크 만들기

```liquid
[{{ item.repo.nameWithOwner }}]({{ item.repo.url }})
[{{ item.release.tagName }}]({{ item.release.url }})
[#{{ item.pr.number }}]({{ item.pr.url }})
```

---

## 예제: 전체 템플릿

```liquid
{% assign excludeOwners = "my-org another-org" | split: " " %}

### Hi there 👋

#### 🚀 Latest releases I've contributed to
{% for item in releases limit:5 %}
{% unless excludeOwners contains item.repo.owner %}
- [{{ item.repo.nameWithOwner }}]({{ item.repo.url }}) ([{{ item.release.tagName }}]({{ item.release.url }}), {{ item.release.publishedAt | humanize }}){% if item.repo.description %} - {{ item.repo.description }}{% endif %}
{% endunless %}
{% endfor %}

#### 🎉 Opensource Contributions
{% for item in contributions limit:5 %}
{% unless excludeOwners contains item.repo.owner %}
- [{{ item.repo.nameWithOwner }}]({{ item.repo.url }}) - [#{{ item.pr.number }}]({{ item.pr.url }}) {{ item.pr.title }}
{% endunless %}
{% endfor %}

{% if recentWork.size > 0 %}
#### 👷 Check out what I'm currently working on
{% for item in recentWork limit:5 %}
- [{{ item.repo.nameWithOwner }}]({{ item.repo.url }}){% if item.repo.description %} - {{ item.repo.description }}{% endif %} ({{ item.pushedAt | humanize }})
{% endfor %}
{% endif %}

{% if stars.totalStars %}
#### ⭐ Total Stars: {{ stars.totalStars }}
{% endif %}
```

---

## 더 알아보기

고급 문법은 공식 문서를 참고하세요:

- [LiquidJS 공식 문서](https://liquidjs.com/)
- [Liquid 태그](https://liquidjs.com/tags/overview.html)
- [Liquid 필터](https://liquidjs.com/filters/overview.html)

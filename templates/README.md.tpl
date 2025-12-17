### Hi there 👋

{{/* ===== Latest releases I've contributed to 설정 ===== */}}
{{- $releaseLimit := 5 -}}
{{- $excludeReleaseRepos := list "mst" -}}

#### 🚀 Latest releases I've contributed to
{{- $releaseCount := 0 }}
{{- range recentReleases 15 }}
{{- if and (lt $releaseCount $releaseLimit) (not ($excludeReleaseRepos | has .Name)) }}
- [{{ .Name }}]({{ .URL }}) ([{{ .LastRelease.TagName }}]({{ .LastRelease.URL }}), {{ humanize .LastRelease.PublishedAt }}){{ with .Description }} - {{ . }}{{ end }}
{{- $releaseCount = add $releaseCount 1 }}
{{- end }}
{{- end }}

{{/* ===== Opensource Contributions 설정 ===== */}}
{{- $prLimit := 5 -}}
{{- $excludeOwners := list "moseoh" "moseoh-org" -}}

#### 🎉 Opensource Contributions
{{- $prCount := 0 }}
{{- range recentPullRequests 99 }}
{{- if and (lt $prCount $prLimit) (eq .State "MERGED") (not ($excludeOwners | has .Repo.Owner)) }}
- [{{ .Repo.NameWithOwner }}]({{ .Repo.URL }}) - [#{{ .URL | splitList "/" | last }}]({{ .URL }}) {{ .Title }}
{{- $prCount = add $prCount 1 }}
{{- end }}
{{- end }}

<!-- DEBUG: 최근 PR 목록 (State 무관) -->
{{- range recentPullRequests 10 }}
<!-- {{ .Repo.NameWithOwner }} | State: {{ .State }} | {{ .Title }} -->
{{- end }}

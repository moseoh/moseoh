### Hi there 👋

{{/* ===== 설정 ===== */}}
{{- $username := "moseoh" -}}
{{- $releaseLimit := 5 -}}
{{- $prLimit := 5 -}}
{{- $excludeReleaseRepos := list "mst" -}}

#### 🚀 Latest releases I've contributed to
{{- $releaseCount := 0 }}
{{- range recentReleases 15 }}
{{- if and (lt $releaseCount $releaseLimit) (not ($excludeReleaseRepos | has .Name)) }}
- [{{ .Name }}]({{ .URL }}) ([{{ .LastRelease.TagName }}]({{ .LastRelease.URL }}), {{ humanize .LastRelease.PublishedAt }}){{ with .Description }} - {{ . }}{{ end }}
{{- $releaseCount = add $releaseCount 1 }}
{{- end }}
{{- end }}

#### 🎉 Opensource Contributions
{{- $prCount := 0 }}
{{- range recentPullRequests 50 }}
{{- if and (lt $prCount $prLimit) (eq .State "MERGED") (ne .Repo.Owner $username) }}
- [{{ .Repo.NameWithOwner }}]({{ .Repo.URL }}) - [#{{ .URL | splitList "/" | last }}]({{ .URL }}) {{ .Title }}
{{- $prCount = add $prCount 1 }}
{{- end }}
{{- end }}

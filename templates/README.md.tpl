### Hi there 👋

{{/* ===== 설정 ===== */}}
{{- $releaseLimit := 5 -}}
{{- $prLimit := 5 -}}
{{- $excludeReleaseRepos := list "mst" -}}
{{- $excludeOwners := list "moseoh" "moseoh-org" -}}

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
{{- range recentPullRequests 100 }}
{{- if and (lt $prCount $prLimit) (eq .State "MERGED") (not ($excludeOwners | has .Repo.Owner)) }}
- [{{ .Repo.NameWithOwner }}]({{ .Repo.URL }}) - [#{{ .URL | splitList "/" | last }}]({{ .URL }}) {{ .Title }}
{{- $prCount = add $prCount 1 }}
{{- end }}
{{- end }}

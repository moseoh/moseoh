### Hi there 👋

{{/* ===== 설정 ===== */}}
{{- $username := "moseoh" -}}
{{- $releaseLimit := 5 -}}
{{- $prLimit := 5 -}}
{{- $excludeReleaseRepos := list "moseoh/mst" -}}

#### 🚀 Latest releases I've contributed to
{{- $releaseCount := 0 }}
{{- range recentReleases 15 }}
{{- $excluded := false }}
{{- range $excludeReleaseRepos }}{{ if eq . $.Name }}{{ $excluded = true }}{{ end }}{{ end }}
{{- if and (lt $releaseCount $releaseLimit) (not $excluded) }}
- [{{ .Name }}]({{ .URL }}) ([{{ .LastRelease.TagName }}]({{ .LastRelease.URL }}), {{ humanize .LastRelease.PublishedAt }}){{ with .Description }} - {{ . }}{{ end }}
{{- $releaseCount = add $releaseCount 1 }}
{{- end }}
{{- end }}

#### 🎉 Opensource Contributions
{{- $prCount := 0 }}
{{- range recentPullRequests 50 }}
{{- if and (lt $prCount $prLimit) (eq .State "MERGED") (not (.Repo.Name | hasPrefix (printf "%s/" $username))) }}
- [{{ .Repo.Name }}]({{ .Repo.URL }}) - [#{{ .Number }}]({{ .URL }}) {{ .Title }}
{{- $prCount = add $prCount 1 }}
{{- end }}
{{- end }}

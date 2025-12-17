### {{variables.greeting}} 👋

#### 🚀 Latest releases I've contributed to
{{#each (limit releases 5)}}
- [{{repo.name}}]({{repo.url}}) ([{{release.tagName}}]({{release.url}}), {{humanize release.publishedAt}}){{#if repo.description}} - {{repo.description}}{{/if}}
{{/each}}

#### 🎉 Opensource Contributions
{{#each (limit contributions 5)}}
- [{{repo.nameWithOwner}}]({{repo.url}}) - [#{{pr.number}}]({{pr.url}}) {{pr.title}}
{{/each}}

{{#if (gt (count recentWork) 0)}}
#### 👷 Check out what I'm currently working on
{{#each (limit recentWork 5)}}
- [{{repo.nameWithOwner}}]({{repo.url}}){{#if repo.description}} - {{repo.description}}{{/if}} ({{humanize pushedAt}})
{{/each}}
{{/if}}

{{#if stars.totalStars}}
#### ⭐ Total Stars: {{stars.totalStars}}
{{/if}}

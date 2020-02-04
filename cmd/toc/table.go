package main

import (
	"github.com/dustin/go-humanize"
	"html/template"
)

func createTableTemplate() *template.Template {
	htmlTemplate := `
{{ range . -}}
### {{ .GroupName }}
{{ range $index, $element := .VersionToGroups }}
<div class="v-{{ $element.Info.GraphHopperVersion }}"{{ if ne $index 0 }} style="display: none"{{ end }}>
  {{ $version:=$element.Info.GraphHopperVersion -}}
  {{template "widget-groups" $element -}}
</div>
{{ end }}
{{ end }}

{{define "widget-groups"}}
<table>
<tr>
  <th>Region</th>
  <th>Install</th>
  <th>Size</th>
  <th>Coverage</th>
</tr>
{{ $graphHopperVersion := .Info.GraphHopperVersion -}}
{{- range .Regions }}
<tr>
  <td class="regionInfo">{{ .Title }}</td>
  <td><a href="locus-actions://https/graphhopper.develar.org/locus/{{ .LocusUrl }}">Locus</a></td>
  <td>{{ humanSize .TotalSize }}</td>
  <td><a href="/coverage.html#{{ regionCoverageId . }}@{{ $graphHopperVersion }}">coverage</a></td>
</tr>

<tr class="infoRow">
<td colSpan="4">
  {{ if eq (len .Parts) 1 -}}
    zip: <a href="{{ .DirUrl }}/{{ (index .Parts 0).FileName }}">download</a>
  {{- else -}}
    {{ $region := . -}}
    zip:
    {{ range .Parts -}}
      <a href="{{ $region.DirUrl }}/{{ .FileName }}">part {{ .Index }}</a> ({{ humanSize .Size }}){{ if isCommaRequired $region . }},{{ end }}
    {{ end -}}
  {{ end }}
</td>
</tr>
{{ end }} 
</table>
{{ end -}}
`

	t := template.Must(template.New("html-tmpl").Funcs(template.FuncMap{
		"humanSize": func(size int64) string {
			// it uses 1000 and not 1024
			return humanize.Bytes(uint64(size))
		},
		"regionCoverageId": func(region Region) string {
			if region.Name == "de-at-ch" {
				return "dach"
			} else {
				return region.Name
			}
		},
		"isCommaRequired": func(region Region, part PartInfo) bool {
			return part.Index != len(region.Parts)
		},
	}).Parse(htmlTemplate))
	return t
}

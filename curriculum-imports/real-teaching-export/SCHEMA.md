# export/ schema

Everything the dashboards show, as JSON, for a site that wants to render it with
its own components rather than embed the generated HTML.

## Files

    export/manifest.json          year groups, classes, counts, and the calendar
    export/<group>/<class>.json   one class, with every lesson, plan and worksheet

`<group>` is `primary1` to `primary6`. `<class>` is `english`, `mathematics`,
`science`, `global-perspectives`, `computing` or `art-design`.

## manifest.json

    {
      "school":       "Selong Bay School",
      "academicYear": "26/27",
      "calendar":     { year start and end, terms, school holidays, public holidays },
      "totalLessons": 3137,
      "groups": [
        { "group": "primary1", "label": "Primary 1", "stage": "Stage 1",
          "classes": [ { "slug": "english", "short": "English", "code": "0844",
                         "title": "...", "periods": "5 periods a week",
                         "lessons": 194, "file": "primary1/english.json" } ] }
      ]
    }

## <group>/<class>.json

Top level: `group`, `groupLabel`, `stage`, `slug`, `title`, `short`, `code`,
`periods`, `driveFolder`, `resources[]`, `curriculum`, `ongoing`, `units[]`,
`lessons[]`.

`curriculum` carries the learning objectives:

    { "code", "title", "stage", "framework", "note",
      "strands": [ { "title", "objectives": [ { "ref", "title" } ] } ] }

`note` is the honest provenance line: where a Cambridge framework was available it
says so, and where one was not it says the map works at strand level. Render it.

`ongoing` is an optional cross-cutting card, present on Maths, Science and
Computing: `{ "title", "blurb", "items": [ { "ref", "title" } ] }`.

Each entry in `lessons[]`:

    { "lesson": 60, "date": "2026-10-27", "weekday": "Tuesday", "term": "Term 1",
      "unit": "Unit 3: Fractions, decimals and percentages",
      "strand": "Mathematics", "phase": "practice",
      "refs": ["6Nf"], "title": "...", "notes": "",
      "plan":      { see below },
      "worksheet": { "tasks": [ { "heading", "instruction", "body" } ], "objectives": "6Nf" },
      "paths":     { "guide": "lessons/...", "worksheet": "lessons/..." } }

`phase` is one of `content`, `practice`, `review`, `assessment`, `project`.

`plan`:

    { "lesson", "title", "date", "weekday", "term", "unit", "phase",
      "objectives": [ { "ref", "title" } ],
      "focus", "prior", "next",
      "intro":  "...",
      "main":   [ "...", "..." ],
      "plenary": "...",
      "look_for": "...",
      "resources": [ "..." ],
      "vocabulary": "...", "notes": "...",
      "timings": ["10 min", "25 min", "10 min"] }

`timings` lines up with `intro`, `main` and `plenary`, in that order.

`worksheet.tasks[].body` is a fragment of HTML: ruled lines, answer boxes, tables,
draw areas. It uses the `ws-*` classes in the stylesheet, and is meant to be
injected with `dangerouslySetInnerHTML` or equivalent. It contains no scripts and
no external references. Take the styles from `WORKSHEET_CSS` in `build.py`, or
copy them out of any generated `lessons/**/worksheet.html`.

## Regenerating

    python3 build.py

rewrites `dashboards/`, `lessons/` and `export/` from `data/`. The data files are
the source of truth; nothing is hand-edited downstream.

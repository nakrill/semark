# Changelog of the language

The language is versioned apart from the package: `semark` 0.8.x implements Sema v0.8.

## v0.8 — October 2026

Roles (`for:`), time (`today`, `now`, durations, `.age`, `refresh:`), `empty:`, `except:`, selection with `.selected`, `over:` with a list, names scoped to their anchor, and assumptions as `#a…`.
After the two pitch-to-drawing runs and the first controlled study.

### v0.8 as implemented by Semark

- Resolution walks the context dropping the outermost segment first (`form.section.name`, `section.name`, `name`); the earlier text said "nearest-first" and was corrected to what makes a reference anchor work.
- `name-is-type` and `unquoted-space` are errors (decisions/).
- Checks the text did not have: a name with a space, no space after the colon, a definition with no type, an unknown mark, a value list cut short, a second label, a `->` target that resolves to nothing, a name in braces that resolves to nothing, a `level:` that claims too much, two folders with one design name.
- Open: an enum cannot say its own order; there is no "one of this collection" choice; an accessor after `design/name` does not resolve.

## v0.7

`range:`, `unique:`, `covers:` and `enabled:`, for a setup form with rules across a list.

## v0.6

Quoted values, and five rules on what gets drawn, after the first wireframe renderer read the designs.

## v0.5

Comparisons, derived values with `is:`, and anchors that add to a reference, for a seven-day trend widget.

## v0.4

Unknown words, `span:`, `format:`, `like:`, filter values in states, and four written rules, after the HTML run with no design system.

## v0.3

Value conditions, filter options, paging, counts, fallbacks and defaults that must exist, after the second design-agent run.

## v0.2

Copy, states as scenarios, presentation and levels, after the first design-agent run.

## v0.1

Tokens, definitions and references, nesting by headings and lists, the first checks.

# What the checker reports

> Every rule in the checks table of [syntax.md](syntax.md) v0.8, the severity the spec gives it, the code Semark reports it under, and the test that pins it.
> Every rule has a code; a rule whose severity or reach was a decision rather than the spec's plain word points at `decisions/`.
> Tests are in `test/semark.test.js` unless another file is named.
> The checker lives in `packages/semark/src/check.js`; the command line (`semark check`) and every editor that embeds the library call it, so there is no second implementation to drift from.

## The v0.8 checks table

| Rule (v0.8) | Spec severity | Semark code | Semark severity | Pinned by |
| --- | --- | --- | --- | --- |
| reference resolves to nothing | error | `unresolved`, with a hint when the name differs only in case, or the path runs through a token that opened no scope | error | never silent: each mistake in mistakes.md is one diagnostic |
| reference matches more than one thing | error | `ambiguous` | error | ambiguity is an error naming both candidates |
| a top-level name defined twice in one design | error | `duplicate` (on the full path, as the scoping rule says) | error | a definition made twice is an error |
| a step that defines an action, field or screen already defined on a screen | warning | `step-redefines` | warning | value rules: each page of the second corpus plants its mistake once |
| a reference that resolves into a different group than the references beside it | warning | `wrong-group` (a bare name in a list of three or more, all others in one group) | warning | value rules: each page of the second corpus plants its mistake once |
| `for:` names a role the roles vocabulary lacks | error | `role-missing` | error | value rules: each page of the second corpus plants its mistake once |
| `except:` names something outside the choice's vocabulary | error | `except-outside` | error | value rules: each page of the second corpus plants its mistake once |
| a duration without its unit | error | `duration-unit` (`.age` comparisons and `refresh:`) | error | value rules: each page of the second corpus plants its mistake once; value rules: the edges |
| `.selected` on a list with no `select:` | error | `selected-without-select` | error | value rules: each page of the second corpus plants its mistake once |
| unknown type, or a pattern not in the vocabulary | error | `unknown-type`, `unknown-pattern` | error | a definition made twice is an error; an unknown pattern is an error |
| `when:` names a field or config that does not exist | error | `unresolved` (names only, also in `given:` and `enabled:`) | error | the corpus: 11 errors and 9 warnings in onboarding |
| `when:` compares an enum to a value it does not have | error | `enum-value` (also `given:`, `enabled:`, `where:` and a value's own `when:`) | error | value rules: each page of the second corpus plants its mistake once; value rules: the edges |
| `default:` names nothing defined | error | `default-missing` (a value of the field, a pattern, `required`/`optional`, `draw`/`skip` on a state, or quoted text on a text type) | error | value rules: each page of the second corpus plants its mistake once; value rules: the edges |
| a number, count or size written only in prose | warning | `number-in-prose` (notes only, a number with a unit word; decisions/number-in-prose.md) | warning | value rules: each page of the second corpus plants its mistake once |
| `"?"` words, or an action with no words | warning, counted as unknown words | `unknown-words`, `action-no-words`; both counted in readiness | warning | readiness of form.md, worked out by hand; value rules: readiness |
| `nav.pages` with no `per:` | warning | `nav-no-per` | warning | value rules: each page of the second corpus plants its mistake once |
| a mark's value with a space, not quoted | error | `unquoted-space` (every key; decisions/unquoted-space.md) | error | the corpus: 11 errors and 9 warnings in onboarding |
| a definition outside the anchor's subtree on a screen or widget page | info | `outside-anchor` (data shapes and what they hold are never drawn, so they are left alone) | info | value rules: each page of the second corpus plants its mistake once |
| a reference whose own `when:` contradicts its definition's | error | `when-contradicts` (literal clashes in pure ANDs; never inference) | error | value rules: each page of the second corpus plants its mistake once; value rules: the edges |
| pattern does not fit the field's type | warning | `pattern-fits` (lists, collections and enums also through `of:`) | warning | value rules: each page of the second corpus plants its mistake once |
| `?` with no `default:` | warning | `open-no-default` | warning | the corpus: 11 errors and 9 warnings in onboarding |
| `#a…` assumptions | info, counted per screen | `assumed`; counted in readiness and in the command's line | info | value rules: each page of the second corpus plants its mistake once; value rules: readiness |
| a file id that is not written yet | info | `forward` | info | the corpus: 11 errors and 9 warnings in onboarding |

## Checks Semark adds

| What | Code | Severity | Pinned by |
| --- | --- | --- | --- |
| a definition's name is also a type's name (syntax.md, *Names and nesting*) | `name-is-type` | error (decisions/name-is-type.md) | trap 3: a name that is also a type |
| a name with a space, `[[Restaurant name: text]]` | `name-has-space` | error | never silent: each mistake in mistakes.md is one diagnostic |
| no space after the colon, `[[name:text]]` | `no-space-after-colon` | error | the same |
| a definition that names no type, also when the type is in capitals | `no-type` | error | the same |
| a flag Sema does not know | `unknown-mark` | warning | the same |
| a value list cut short by a space before a value, `\|a=A\| b=B\|` | `values-cut-short` | error | the same |
| more than one label on a token | `second-label` | warning | the same |
| a token alone on its line, not first under its heading, opens no scope | `no-scope` | info | trap 9: a second standalone token mid-section opens no scope |
| a `->` target that resolves to nothing (a forward reference when kind-first or in another design) | `goto-unresolved` | error | value rules: each page of the second corpus |
| a name in `{…}` in a label, hint, error or other words that resolves to nothing | `brace-unresolved` | error | the same |
| `level:` in the frontmatter claims more than the page reaches | `level` | warning | the same; value rules: readiness |
| two folders declare one design name: the first keeps it, the second takes no part | `design-twice` (about the corpus, printed first by the command) | error | two folders declaring one design name |

The mistakes above are read only on pages that say `sema:`, and each is reported once: a word that one finding explains is not reported again as an unknown mark, and a mistyped name is not reported again as resolving to nothing.
They are planted, one per line, in `test/fixtures/corpus/onboarding/mistakes.md`.
The value-level rules are planted one page each, wrong once and right once, in `test/fixtures/values/values/`; each page is named for its rule's code.

## Readiness

A screen or widget is **ready** when it has no errors, no field it shows is open without a default, and it has no unknown words.
An action with no words counts as unknown words; `#a…` assumptions are counted apart and do not stop a screen being ready.
Readiness also gives the level the page reaches (L0–L4, syntax.md *Levels*).
Fields are counted through their definitions, once each; a reference settles an open field only by saying so on the reference itself (`initial:`, `required`, `optional`).

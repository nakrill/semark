---
name: semark
description: "Write, check or draw from a Sema design — Markdown with [[…]] tokens that describe flows, data and screens by meaning, never by look."
---

# Sema

Sema (Greek *sēma*, sign) describes a design by what it means: purpose, steps, data, interaction patterns, structure.
It has no colour, no type and no pixels.
Those belong to a **binding**, which maps patterns to a design system's components and carries that system's conventions.
Pipeline: the sources (a brief, a policy, an existing drawing) → brief → Sema → binding → a drawing, a prototype, or code.

The authority is `spec/syntax.md` in this repository; `spec/structure.md`, `spec/drawing.md` and `spec/checks.md` complete it.
Read `spec/syntax.md` before writing.
When it and this skill disagree, the spec wins and this skill needs fixing.
The language changes after every design and every agent run; record what you learn in `studies/learnings.md`.

The checker is the `semark check <corpus-root>` command; `semark dump <corpus-root>` gives the resolved model as JSON.
Over the Model Context Protocol the same are `semark_check`, `semark_page` and `semark_dump` (`packages/mcp`).

## Three jobs

1. **Write**: turn a brief, a policy, a ticket or an existing drawing into Sema, through a brief.
2. **Check**: run the checker, then read the design against its sources.
3. **Draw**: build screens from Sema through a binding, following *What gets drawn*.
   For an HTML prototype with no design system, load `skills/semark-to-html/SKILL.md`.

## The token

Prose is free; meaning lives in tokens.

```
[[name]]                    reference
[[name: type marks…]]       definition
[[name marks…]]             reference that refines what it points at
```

- Write one token per line where possible; one sentence per line keeps one decision per line for `git blame`.
- Text after a token on the same line is its note. For a design, flow, step, group or vocabulary, the note is its description.
- Names are kebab-case, and never a type's name (`text`, `image`, `date`, `summary` and the others are taken).
- A name has no spaces, a colon is followed by a space, and a type is lower case; the checker names each of these mistakes, but only after the page is written.
- **Headings are for people and never hold a token.**
  - A token alone on the first line under a heading anchors that heading: everything below it, up to the next heading of the same or higher level, is its child.
  - A heading with no anchor changes no path. A sentence between the heading and the token means the token is not first, opens no scope, and the fields below belong to the page or the enclosing anchor.
  - Indented list items are children of the item above.
- An anchor can be a reference: `[[restaurant]]` under a heading adds the fields below it to a group defined on another page.
- **Resolution.** A reference is tried at its full path, then with the context dropped from the outside in, then by its last segment when exactly one definition in the design ends with it. Two matches are an error; write the path, `[[contact.first-name]]`.
- **Scope.** Names are scoped to their anchor. Only top-level names (flows, screens, widgets, groups, vocabularies, settings, contexts) must be unique in a design.
  - Two screens may each have a state `empty` or an action `close`.
  - From outside, write the path: `[[check-details.send]]`.
  - Never prefix names to keep them apart.
- **Define once.** A thing is defined where it is drawn and referred to everywhere else. A flow's step names the screen's action; it does not define a second one.
- Names resolve across the whole design, not per file, so pages can be split or merged freely.
- **Other designs.**
  - A name in another design is written `[[design/name]]`, for example `[[menu-builder/dishes]]`, `[[ordering/basket-screen]]` or `[[words/close]]`.
  - A design not written yet is a forward reference, which is fine.
  - An accessor after a cross-design path (`ordering/basket.count`) does not resolve yet; define a derived field in your own design instead.
- A reference inherits its definition's `when:`. Its own `when:` narrows it, as if joined with `&`. So one field can have two labels: `[[order-number "Order:" when:order.fulfilment=delivery]]` and `[[order-number "Collection code:" when:order.fulfilment=pickup]]`.
- Names in a condition resolve from where the condition is written, like references: `when:fulfilment=delivery` inside the `order` group means `order.fulfilment`.

## Types

| Group | Types |
| --- | --- |
| data | `text` `longtext` `number` `date` `phone` `email` `bool` `enum` `list` `confirm` `address` `image` |
| many | `collection` (with `where:` `sort:`), `series` (with `length:` or `span:`) |
| shapes | `group` (with `like:`), `config` (a setting), `context` (given by navigation, by `with:`, or by who is signed in), `states` (a status vocabulary) |
| flow | `design` `flow` `step` |
| screen | `screen` `widget` `region` `section` `nav` `column` `action` `feedback` `summary` `help` `state` `fallback` |
| vocabulary | `pattern` (with `fits:`) in `patterns.md`; `word` in `words.md` |

- A `fallback` is what one cell or card shows instead of its value, with its own `when:`. It keeps the card's heading and the heading's actions. A `state` is a whole frame.
- A value made of several parts, such as opening hours with an opening and a closing time, is a group. A series of them uses `like:` to keep the entry's other fields: `[[branch: group like:location]]`.

## Marks

- **Values:**
  - `|delivery|pickup|`;
  - with screen words, `|asap=As soon as possible|`;
  - words not known, `|asap=?|`;
  - a value that exists only sometimes, `|ready=Ready to collect when:order.fulfilment=pickup|`;
  - no space before a bar: `|a=A|b=B|`, never `|a=A| b=B|`, which cuts the list short.
- **Quoting:** a mark's value that contains a space is quoted: `initial:"7 days"`, `kitchen-type~"Street food"`, `is:"No courier yet"`. Values inside `|…|` need no quotes.
- **Knowledge:**
  - `required` / `optional` / `?`.
  - `default:x` is what to draw while it is `?`; `asks:who` is who answers. A default names something that exists: a value of the field, a pattern, `required` or `optional`, `draw` or `skip` on a state.
  - On read-only data, required means always present and optional means may be missing.
  - `initial:x` is a decided starting value, not a default.
  - `#a3` marks the writer's own assumption, numbered in the brief.
- **Logic:**
  - `when:expr`, `where:expr`, `sort:field` (ascending; `sort:-field` for descending).
  - `of:x`, `length:n`, `span:field` (the time a series covers), `repeat:n..m`.
  - `derived`, `from:a,b`, `like:x`.
  - `unit:x` (or `unit:@config`), `format:x` (how a value is written, as in `format:h:mm`).
- **Rules:**
  - `range:1..20` on a number;
  - `unique:field` and `covers:field` across a list's items;
  - `enabled:expr` (still shown, but unusable while the condition is false);
  - `except:x` on a choice (its vocabulary without those values, or without a field's current value).
- **Roles:** `for:staff`, `for:staff,support`, `for:!support`. This is the same as `when:@user.role=…`, but a checker can collect it. The values are in `roles.md`. A screen's `for:` also tells the binding which shell to use.
- **Time:**
  - built-in values `today` and `now`;
  - durations `30s`, `5m`, `2h`, `7d`;
  - `.age`, the time since a value last changed or arrived;
  - `refresh:2s..3s` on live data.

  Stale data is `when:courier-position.age>30s`. A timeout is `[[awaiting-restaurant -> not-accepted when:awaiting-restaurant.age>10m]]`.
- **Empty values:** `empty:"Not given"` is what a missing value shows. On a group, every child inherits it.
- **Expressions:**
  - `=` `!=` `<` `>` `<=` `>=`, `&` for and, `,` for or (`&` binds tighter), `!` for not; no spaces outside quoted values.
  - `@name` is config or context.
  - Built-ins: `valid`, `submitted`, `filtered`, `searched`, `loading`, `changed`; the value `empty`; `today`, `now`.
  - `.first`, `.last` and `.count` reach into a list (`dishes.first.price<5`). `.selected` is the chosen item of a list with `select:`.
  - In a state's `given:`, `field~value` means a filter on that field is set to that value.
  - An enum is compared only to a value it has; the checker reports any other.
- **Deriving a value:** under a `derived` field, write one reference per value, with `is:` and a condition. The first that holds wins; a line with no condition is the last resort: `[[refund-amount is:total when:problem-kind=never-arrived]]`.
- **Screen:**
  - `> pattern` (L3), `-> target`, `with:name` (what the target is opened for).
  - `present:page|dialog|panel`.
  - `over:target` is what a dialog or panel sits on. It may be a list, and the first one is drawn.
  - `given:expr` on states.
  - A section with `->` opens from its heading.
- **Lists and filters:**
  - `options:values|present|@config`.
  - `select:one|many`: on a filter, how many values it takes; on a table or list, how many items can be chosen, giving it `.selected`.
  - `per:n` on every `nav.pages`.
  - `by:field` / `mark:field` on counts.
  - `of:` on a legend, naming the vocabularies it explains.
  - A sortable column starts in its collection's `sort:` order.
- **Copy:**
  - `"Label"`, `"?"` (nobody has written the words), `"Partial…"` (known only in part).
  - `hint:"…"`, `error:"…"`, `add:"…"`, `placeholder:"…"`.
  - Words can hold values: `"Notes ({notes.count})"`. Shared words are `"{words/close}"`. Built-ins: `.count`, `.first`, `.last`, `.label`.
- **Provenance:** `#ref` (`#refunds-3`, `#brief-R1`, `#a3`). `to-be` means not in the product yet; a field gated by a `to-be` setting is `to-be` too.
- Bare words are flags: `removable`, `sortable`, `readonly`, `row`. Any other bare word is reported as an unknown mark.

## Words

- Every word a user reads is a label, a `hint:`, an `error:`, a `placeholder:`, a value's label, an `empty:`, or `"?"`. Never invent one and never leave one out.
- Only what a user sees has words. A design, flow, step, group or vocabulary is never on screen, and never counts as an unknown word.
- An action needs words even when it is drawn as an icon: they are for people who cannot see the icon.
- Partial copy is drawn as known, with its ellipsis, and never completed.
- Generic interface words (Close, Cancel, All, Back, the paging controls) live once in `words.md` and are used as `"{words/close}"`. A word there that is not yet decided is `?` with a default.
- How a required field, a missing value, a date or a unit looks belongs in the binding's **Conventions** section, never in the design.

## What gets drawn

1. A screen or widget draws its anchor's subtree, and nothing else on the page. A widget's `## Data` is definitions and is never drawn; states are frames, never content.
2. A reference with no pattern shows its value as text; only `> pattern` makes a control.
3. A pattern's children are its content: a tile's figure, a table's columns.
4. Conditions resolve where they are written.
5. A widget with no states of its own is drawn in each state of the screen that places it.
6. Only screens and widgets are frames.
   - A `design` page is a map of its flows, their steps and the screens they reach.
   - A `flow` page is a graph of its steps.
   - `data`, `config`, `states`, `roles`, `patterns` and `words` pages are lists.
7. Only what a user sees has words; nothing else is hatched for lacking them.

How a frame looks is the renderer's or the binding's business, not the design's.
That includes filling `{…}` with sample values and not repeating a label its section already shows.
`spec/drawing.md` has the full contract.

## Levels

L0 intent · L1 steps and transitions · L2 fields with types, required-ness and conditions · L3 a pattern on everything shown · L4 regions, sections, and states with `given:`.

Each level only adds; anything unstated is open.
A design can start at any level: one sentence, or a screen somebody sketched.
The checker works a page's level out from its tokens and reports a frontmatter `level:` that claims more.

## States

- A screen's states are its frames: one per scenario worth drawing, and no more.
- `given:` says what holds in the frame: fulfilment, role, settings, filters, validity, the selected item, the age of live data. Everything else is as it starts. A frame draws every field whose `when:` and `for:` hold under its `given:`.
- Give every state its full context, including `loading` and `@user.role`: which section, which settings, which role.
- Children of a state are only what it adds, such as a banner or a message. A state with no children and no visible difference is a frame nobody can tell apart; say what it shows.
- A state the sources lack is `?` with `default:draw` or `default:skip`.
- A widget may have states of its own, to be drawn and reviewed on its own.
- A request that another party answers (a restaurant accepting an order, a payment confirming) is a status vocabulary plus one state per outcome. Each outcome must reach a screen.

## Structure

A design is a folder whose `index.md` says `sema: design`; its name is the `[[name: design]]` token on that page.
It can start as one file with one sentence and grow into sub-pages; names belong to the design, not to the file, so nothing that refers to a page changes when the page is split or moved.

```
<corpus root>/
  patterns.md                   sema: patterns — a closed vocabulary; add a pattern only when a design needs it
  words.md                      sema: words — shared words, used as {words/close}
  roles.md                      sema: roles — who sees what, as values for for:
  <design>/
    index.md                    sema: design — [[name: design]], intent, flows by name, the pages in reading order
    data.md                     sema: data — the record
    config.md                   sema: config — settings that change the screens
    states.md                   sema: states — status vocabularies
    <flow>.md                   sema: flow — steps and branches
    <screen>.md                 sema: screen — one screen; several small screens (dialogs) may share a page
    <widget>.md                 sema: widget — ## Card and ## Data
```

- **Reading order is semantic, never numbered in titles:** design → flows → data, config, states → screens in the order the flows reach them, each followed by the widgets it places. `semark dump` reports it; the design's `index.md` lists its pages in that order so a reader without a tool starts in the right place.
- **A flow is defined once.** While it is only a line, the design's `index.md` defines it. Once it has a page, the page defines it and the index refers to it, `[[sign-up]]`.
- **Widgets.** Give a part of a screen its own page when the screen would otherwise be too long, or when another screen could reuse it. The screen places the widget by referring to its anchor, `[[order-summary]]`, in order.
- **A thing keeps its name as it gains detail.** `[[form: step]]` later becomes `[[form: screen]]`, and nothing that pointed at it changes.
- **Frontmatter:** the host application owns `id` and whatever else it keeps there; Sema adds `sema:` and `level:` and nothing else.
- Use the same word for the same axis in every design: `fulfilment` is delivery or collection everywhere, never `delivery-mode` on one page.

## Writing

1. **Brief first.** Read every source for the feature: the brief, the policies it touches, what exists already, the drawing when one is being shaped.
   - Write `brief.md`: numbered requirements, then conflicts quoting both sides, then gaps and the screens each one blocks, then assumptions.
   - Put conflicts first; that is where most findings are.
2. **Start at the level the sources support.**
   - Do not invent a field, value or word. If the source is silent, write `?` (or `"?"` for words) with a `default:` so a drawing agent can proceed.
   - When you decide something yourself, tag it `#a3` to the brief's assumption.
3. **Reuse before defining.** Search the corpus for the vocabulary, field or widget first (`ordering/order-statuses`, `onboarding/restaurant`). Refine with a reference instead of redefining.
4. Carry every word the user will read exactly as the source has it: labels, consent text, errors, notices.
5. Put every number, count, size and duration in a token (`per:15`, `length:7`, `refresh:2s..3s`), never only in prose.
6. Name vocabularies separately from fields: `[[order-statuses: states |…|]]`, `[[order-status: enum of:order-statuses]]`. When a proposal changes a vocabulary, keep both: the as-is one, and the new one marked `to-be`.
7. Write how a derived value is worked out with `is:` lines, not prose. That is where the holes show: a state nobody reaches, or a case with no state.
8. Model filters, search, columns and legends as references to existing fields with a pattern, never as new fields. Give each filter its `options:` and `select:`.
9. Put a controlled document's rule next to the field it governs (for example `#refunds-3` beside the refund amount). That is how the check finds a drawing that breaks it.
10. Write role differences with `for:`, not with long `when:@user.role` chains, and give every state its role.
11. Give every screen its states with `given:`, and make every flow reach a screen for every outcome.
12. Prose that reasons about a drawing ("the header renders X twice") goes in a `::: query`, not in the design.
13. Run `semark check` before you hand anything over, and fix every error; a warning you leave is a decision, so say why in the note.

## Checking

Run `semark check <corpus-root>`; the rules, their codes and severities are in `spec/checks.md`.
In short: a name resolves or it is an error; two matches are an error; a type, a pattern, a role, a value, a default must exist; a word is written or it is `"?"`; a number lives in a token; a mark's value with a space is quoted.

- **Readiness.** A screen is ready when every field it shows is settled or has a default, it has no unknown words, and nothing on its page is an error.
- **Counts.** Report them per screen: fields shown, settled, open with a default, open without one, assumed, and unknown words. With roles, also list per role what it sees.
- **Sources.** Then check against the sources. Values, order, counts and copy the tokens name are now checkable, and most findings come from there.
- **Other designs.** Compare designs with each other too: the same word used for different things, or two vocabularies for one thing.
- **Controlled documents.** When a controlled document (a policy) and a drawing disagree, the design follows the controlled document and says so in a `::: query`. A disagreement with a safety or legal consequence goes in a `::: danger`.
- **Absences.** The checker cannot see what is not written. Look for them by hand: a field collected in a dialog that no record keeps, an action with neither `->` nor an effect, a state that adds nothing visible, a flow with no way back.
- **check.md.** Write the result as `check.md` in the design, saying which findings were already in the sources and which came from writing the tokens.
- **Limits.** A check written by the agent that wrote the design misses things. One run's check missed a name defined twice and passed a valid reference that pointed at the wrong record. Re-read every reference whose resolution surprises you, and say in `check.md` what the check cannot see.

## Drawing

- Follow *What gets drawn*. Draw one frame per state, showing what the state's `given:` makes visible for its role.
- Draw a screen's base state once, then clone it for each other state and apply only what that state's `given:` changes. Never rebuild a state from scratch: that is how frames of one screen drift apart.
- Keep everything that is not product UI outside the frame: one note under each frame (anchor, state, requirement ids, to-be, assumptions, open questions).
- After drawing, compare the frames of each screen and the same token across screens, and fix every difference their states do not explain.
- How to draw each kind of marking:
  - `? default:x`: draw x.
  - `?` alone: draw optional and list it as a question.
  - `"?"`: draw a placeholder word and list it.
  - `to-be`: draw it as product UI, mark it, and list it.
  - `#a…`: draw it and list it as an assumption.
- Use labels exactly. A word not in the files or in `words.md` is invented, so log it.
- Apply the binding's conventions. With no binding, choose them once, use them everywhere, and log them.
- When drawing needs something the Sema does not say, change the Sema first, then draw, and log a loop-back. Classify it: Sema missing something, Sema wrong, binding row missing, or syntax could not say it.
- Look at every frame. Visual defects (overflowing text, truncated labels) are invisible to the check.
- Hand back: binding rows used or added; decisions the files did not make; questions; friction with the syntax; drift left between the Sema and the frames.
  Friction goes into `studies/learnings.md` and the next syntax version.

## House rules

- One sentence per line.
- Open every generated page with a `::: note` saying what made it, from what, and that nothing has been checked by a person.
- Use `::: query` for open questions.
- Never set an owner, a status or any other frontmatter the host application owns.
- Commit only paths you touched, under the agent identity the repository uses, with a `Run-by:` trailer naming the person who ran you, and only when asked.

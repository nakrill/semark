# What the specimens taught

::: note
The record of the Sema experiment of October 2026: seven specimens, five agent runs, one wireframe renderer and one controlled study, in about a week, inside the first project.
Rewritten here with the product's names taken out and the examples moved to the sample corpus (a food-delivery company: restaurants, menus, baskets, orders).
Every lesson is kept, in the order it was learned; what was only about that project's drawing library and folders is reduced to the general lesson it carried.
Nothing here was checked by a person at the time of writing.
:::

## From specimen 01 — a sign-up form

**Unknown must be sayable.**
The drawing marks only the name fields as required; for every other field the source is silent.
A language that forces `required` or `optional` makes the writer guess, so `?` is a value of its own, and a linter can count it.

**As-is and to-be live in the same file.**
Saving a draft comes from the brief and is not drawn.
Splitting it into another file would hide the gap, so lines carry a tag like `to-be #brief-R1`.
That wants to be a general mechanism: every line has a provenance — drawn, brief, requirement, decision.

**Conditions appear at L2 already.**
`when fulfilment = delivery`, `when platform.consent-required` — the data layer cannot be written without a small expression syntax.
Keep it to field, `=`, `and`, `or`, and configuration references.

**Configuration is a source of conditions, not just data.**
Whether consent is asked depends on a platform setting, not on anything the restaurant enters.
The language needs a way to name configuration (`platform.*`, `restaurant.*`) as distinct from the record.

**Reading backwards finds design defects.**
A field appears on the confirmation but on no form; the submit button is not visible in the reading.
Writing the semantics forced both questions, which the pixel reading had not raised.
That is a use of the language in its own right: a consistency check over existing design.

**Data and screen want to be separate files.**
`data.md` is reusable by the edit-details screen; `form.md` only references it.
Screens bind patterns to fields by name, so the field list is not repeated with types.

**L4 needed only four ideas:** region, section, order, and repetition (`repeat:0..1`).
No sizes, no columns.
The column split in the drawing is the binding's business, inferred from `region: aside`.

## Open after specimen 01

- Is `region` a closed set (header, primary, aside, actions) or free?
- Where do states live: in the screen (as here) or in the data (a section is invalid because its fields are)?
- Is copy part of the semantics? Section titles were needed ("Address details" differs from the field name `location`).
- How does a flow reference a screen in another flow before that file exists?

## From reading the design briefs

**`?` is not enough; an open value needs a default.**
The brief skill's rule is that an open decision with no default stops the drawing agent.
So the form is `? default:x asks:who`, and a generator draws `x` while the question stays visible.

**A vocabulary of states is its own artifact.**
The order lifecycle fixes its statuses and their transitions before any screen, because badges, history and the API all use the words.
That is a state machine, and it wants a page kind of its own (`sema: states`), referenced by screens.

**Naming traps belong to the glossary, not the screen.**
"Kitchen type" means the cuisine in one place and the kind of premises in another.
A semantic language makes this worse if field names are free, so names resolve against a project glossary.

**Controlled documents are constraints, not references.**
The refunds policy says a refund never exceeds the order total.
A line needs a way to say *constrained by* a source, so a linter can flag a screen that contradicts it.

**Some structure is semantic even when it looks visual.**
"Two dishes that are a set menu are drawn as one band over both rows" is a grouping statement, not a style one.
L4 needs `group` over items that are already listed, not only containers.

**Artifacts are counted.**
Briefs number screens and sort them ready / blocked / cross-cutting.
A screen file's frontmatter can carry that readiness, derived from how many `?` it still holds.

## From rewriting specimen 01 in tokens

**Ambiguity is now visible.**
On the confirmation, `[[first-name]]` matches the owner and the contact equally.
In prose nobody noticed; as a token it is an error, settled by writing `[[contact.first-name]]`.

**A screen section and a data group can share a name, and that is the binding.**
`[[contact: section]]` in the form makes `[[first-name]]` under it resolve to `contact.first-name` without writing the path.

**Labels are content, and they were already in the drawing.**
The section names in the form's navigation differ from the data names, and both are needed.

**Forward references need a visible shape.**
`menu.publish` looked like a field; `flow.publish-menu` is clearly a file not written yet.
Hence the rule that file ids start with their kind.

**Readiness is countable.**
The form has 17 fields: 6 settled, 7 drawable on defaults, 4 that stop it — all in the secondary contact.
That is a sentence a brief could open with.

## From the structure

**Headings are for people.**
A token in a heading made the page read like code.
Now a heading is plain words, and a token alone on the line under it anchors the section.

**The file layout and the design's structure are different things.**
If names resolve across the whole design, a page can be split or merged without touching a reference, and the host application's own file-becomes-folder rule is then all the structure needed.

**Specimen 01 broke the host's frontmatter.**
`id` and `kind` belong to the application; the language needs keys of its own.

## From specimen 02 — the restaurant list

**Reading is not writing.**
On a list nothing is entered, so `required` and `optional` had to mean *always present* and *may be missing*.
Same words, different question; worth a separate pair of words if it confuses anyone.

**A list needs four new ideas, and only four.**
`collection` with `where:` and `sort:`, `series` with `length:`, `column`, and `derived`.
Everything else on the screen (filters, search, pagination, the legend) was a pattern over a field that already existed.

**Filters are references, not new fields.**
`[[kitchen-type > filter.choice]]` reuses the field the column shows.
So a filter can never offer a value the data does not have.

**Context is not configuration.**
Delivery or collection comes from the navigation; the platform's mode from the operator.
Both are `@`, but they are different kinds of thing, so `context` joined `config`.

**Values that vary by condition do not fit.**
The day symbols differ between delivery and collection, value by value.
An enum cannot say that, so the specimen fell back to a table in prose.
Either values get their own `when:`, or the vocabulary splits in two.

**`a,b&c` needed a precedence rule**, and got one: `&` binds tighter.

**Vocabularies need their own names.**
Defining `order-status` in both the data and the states page was a duplicate.
The vocabulary is `order-statuses`; the field is `order-status: enum of:order-statuses`.

**Most of the value was in the sources check.**
Five disagreements between the drawing, the policy and the other list, found because a token had to name a value, an order or a count.

## From the first design-agent run (specimen 01, drawn blind)

The agent drew three frames from the Sema files alone and never needed the existing design.
What it changed is syntax v0.2.

**Copy was the biggest gap.**
Value labels, helper text, error text and partial copy had no place, so the agent invented them and said so.
Now: `|key=Label|`, `hint:`, `error:`, and a trailing ellipsis for copy known only in part.
And the consent wording was in the source all along; the specimen simply had not carried it.

**A state must say what is true in it.**
`when:` said when a field shows, but nothing said what a frame is showing, so "empty" and a visible conditional field contradicted each other.
Now a state is a scenario: `given:fulfilment=delivery&!valid`, and a frame draws what its `given:` makes visible.

**Presentation is a word of its own.**
The flow went from the form to the dialog while the dialog said it sat over the list, both true and unreadable together.
Now `present:dialog over:browse/restaurants`; the screen's label is the dialog's title, the feedback is the message under it.
The host was also wrong: the dialog sits over one list, not the other.

**Prose that reasons about a drawing does not belong in a design.**
"The header renders the title twice" meant nothing to a blind reader; it is a `::: query` now.

**The binding wrote itself.**
The agent's table — pattern → component → key → variant — became the first binding.
Its library gaps (no multi-line field, no text property on checkbox labels, a misspelt variant) are findings about the design system, not about Sema.

## From the second design-agent run (specimen 02)

**A number in prose is a conflict waiting to happen.**
"13 rows of 50" and "15 per page" disagreed, and no check could see it because neither was a token.
Now `per:15`, and a size written only in prose is a warning.

**A default has to point at something.**
`default:skeleton-rows` meant something only to whoever wrote it.
A default now names a value, a pattern, or `draw` / `skip` on a state.

**Values carry their own conditions.**
`|ready=Ready to collect when:order.fulfilment=pickup|` replaced the prose table, and the same mark covered the problem kinds and the flag types.

**"Too vague to draw" meant the token said what, not which.**
A filter needs its options and how many it takes; a count needs what it counts by and what marks it; a legend needs which vocabularies it explains.
`options:`, `select:`, `by:` / `mark:` and `of:` on the legend close each one.

**A cell's replacement is not a state.**
"Menu not published yet" replaces seven days in one cell; a state is a whole frame.
So `fallback` is its own type.

**The states are the frame list.**
Two fulfilments, two settings and five states made twenty possible frames, and the agent picked five.
Now a screen's states are exactly the frames worth drawing.

## From specimen 03 — the restaurant summary

**One screen, two products.**
Delivery and collection share the header and nothing else that matters, and `when:` carried the whole difference without strain.
What it could not carry cheaply was a value that starts differently per kind: `initial:"7 days"`, refined by `[[period initial:"6 weeks" when:order.fulfilment=pickup]]`.

**Widgets want their own pages.**
Eight trend cards, each with its own series, made the screen unreadable; as eight widget pages, each with a `## Card` and a `## Data`, the screen became a list of eight references.
Names resolving across the design is what made the split free.

**Initial is not default.**
`default:` already meant *what to draw while nobody has decided*; the period's starting value is decided, so it is `initial:`.

**Words carry values.**
"Notes (15)", "Last order 12/11/2025", "Orders this week (…)" — titles with live values in them were everywhere, so labels take `{name}`, with `.count`, `.first`, `.last` and `.label`.

**A dialog needs to know what it was opened for.**
One history dialog serves eight metrics; `-> history with:revenue` passes the metric, and the dialog receives it as a `context`.

**Names collide with types.**
A field called `text` and one called `image` read as types; a name is now never a type's name.

**The check found a policy issue.**
The drawing shows a refund larger than the order's total, which the refunds policy forbids.
It surfaced only because the refund field had to carry the policy's rule next to its definition.

## From reading a states overview

**As-is and to-be can be two vocabularies side by side.**
The policy's day symbols stay as `day-statuses`; the proposal's thirteen states became `day-states … to-be`, and the record carries both fields until one wins.
Nothing in the screen had to change, because the screen only refers to the field.

**A matrix of states per kind is exactly value-level `when:`.**
The drawing's columns per fulfilment with N/A cells turned into one `when:` per value, with no new syntax.

**What is visual stays out.**
A glyph that differs between two bindings is a binding difference; the semantics are the same state.

## From reading a summary screen and a ticket

**The ticket is a third source, and it disagrees with both others.**
It asks for two figures on a tile, a sync date in the header and two filters; the policy and the drawing have none of those.
Each went in as `to-be #ticket-31` beside what ships, so the screen shows both and the check counts the difference.

**Hover is content too.**
The drawings put real information in tooltips, and the first version of the specimen had nowhere to put it.
A `chart.point-details` pattern holds it, and a tooltip's words are checked like any other label: that is how a leftover "Target: 81.0 kg" in a tooltip surfaced.

**Sample content is evidence.**
The drawn notes talk about things only one kind of order has, on a widget the policy puts on the other kind only.

## From the HTML run, with no design system (all three specimens)

The agent built all fourteen frames as one working prototype from the Sema files alone; what it changed is syntax v0.4.

**Sema's patterns are not a component list in disguise.**
With nothing but HTML, the agent reached for the same structures the drawing-tool agent took from the library: radios, a switch, a checkbox, a jump list, a table.
The meaning carried; only the look changed.

**What was missing was words, not meaning.**
About eighty words were invented, most of them on specimen 01's unlabelled form, the rest generic: All, Clear filters, Close, the paging controls.
Now every field carries the drawing's words or `"?"`, an unknown word blocks *ready*, and generic words live once in `words.md`.

**Some things belong to neither the design nor the patterns.**
The required marker, how a missing value is shown, date formats, units after values: the agent decided each one per screen.
They are conventions of a design system, so they now have a section in the binding.

**One mark meant two things.**
`over:` was both "the dialog sits on" and "the span a series covers"; the second is `span:` now.

**Our own specimens broke our own glossary.**
Specimen 01 used one word for what specimens 02 and 03 reserved for something else.
It took an outside reader comparing all three to see it; specimen 01 is migrated.

**Symbols are an open decision.**
The agent drew statuses and priorities in its own shapes and colours, and argued that a meaning should not look different in each binding.
That would make symbols a third shared layer beside patterns and words: a product decision, not a syntax one.

## Upgrading the specimens to v0.4

**Shared words needed no new syntax.**
A label can already hold a value in braces, and a word is a value: `"{words/close}"`.
Twenty-odd literal "Close", "Cancel", "Items per page:" and "No data available" became references, so the next change to one of them is one line in `words.md`.

**Full context on every state found a missing setting.**
Specimen 01's states never said whether the platform requires consent, yet every one of them drew the consent field.
Each now says `@platform.consent-required`.

**Giving every series its words fixed a dialog title.**
The history dialog is titled `"{metric.label}"`, and the series had no label, so the HTML agent borrowed the card's; each series now carries its own.

**The drawing answered a fallback the HTML agent asked about.**
Two values on the no-data screen read "No data available"; both widgets now say so, and a third follows on a default.

## From describing the seven-day trend precisely

**A widget can be a folder of its own.**
The trend became a card, one day's data and what opens from it, with the screen placing it by one reference.

**Derivation is the precise part.**
Which of thirteen states a day is in was the question nobody had written down; it is now twelve `is:` lines, first match wins, with `<` and `>` and `.first` / `.last` into the day's orders.
Writing them found two holes at once: two complete orders reach no state, and more than 100 % has none.

**The component told us what the proposal meant.**
Its "no orders" variant draws the proposal's "no data", read from the instance tree, not from the labels.
Semantics and binding checked against each other settle naming that either alone leaves ambiguous.

**The binding is where symbols already live.**
The encoding (a ring for completion, dashed for no data, a cross for a gap, badges by priority) is written in the binding, so another binding can be compared against it line by line.
That is a first answer to the open question about symbols: keep them in the binding, written down, rather than in the design.

## From the first wireframe renderer

The editor drew the specimens as wireframes straight from the tokens: a flow graph, a state switcher, `when:` boxes, fallbacks, shared words and a count strip.
A tool is the strictest reader yet, and it found what two agents had quietly decided for themselves; that is syntax v0.6.

**A value with a space has to be quoted.**
`initial:30 days` drew the period on 7 days, because a tool cannot tell where the value ends; agents guessed right, a parser cannot.

**What gets drawn needed rules of its own.**
The renderer drew a widget's `## Data` definitions as a second chart, turned a read-only enum in the header into a choice control, put each tile's figure in an input beside the tile, and could not hide collection-only fields in a delivery frame because `fulfilment` was resolved from the wrong place.
Five rules now say what a frame is: the anchor's subtree only; no pattern means a value as text; a pattern's children are its content; conditions resolve where they are written; a widget without states takes its screen's.

**Some of what it showed is the renderer's business, not Sema's.**
Interpolating `{…}` with sample values, and not repeating a label its section already shows, are how a frame looks; they belong to whoever draws it.

**A design page is not a screen.**
The renderer drew each specimen's cover as a frame, with its flows as hatched, unlabelled fields, because nothing said a design or a flow is not on screen.
Rules 6 and 7: only screens and widgets are frames, and only what a user sees has words; a design page is a map of its flows.
It also caught specimen 01 defining its flow twice, in its cover and in its flow page; a flow is defined once, where its page is.

## From specimen 04 — a setup form with rules across a list

**A form whose shape changes with one choice is just `when:`.**
Five plan types, each with its own cards, came out as one group per type with a `when:` on `plan-type`; no new construct.

**Rules across a list needed words.**
"A day cannot be assigned to more than one plan" and "all days must be assigned" are rules about the list, not about any field; they are `unique:days` and `covers:days` now.
Ranges ("Must be between 1 and 20") are `range:1..20`, with the drawn words kept as the hint.
"Enabled only once every required field is filled" is `enabled:valid`: shown but unusable, which `when:` could not say.

**The drawing shows one type well and four not at all.**
Writing every type from the policy made the gap countable: about thirty unknown words, nearly all on the four undrawn types.

**Names collided twice in one design.**
A screen named after the field it shows, and a field named `number`; both were caught only because the check runs on names.

## From specimens 05, 06 and 07, written in parallel

Three agents against v0.7, merged on one day.

**The specimens now link up.**
The list, the trend and the summary open the orders design; the setup lands on the details page; the admin screen writes the setting the list reads.
Every forward reference from the earlier specimens but three now resolves.

**Three screens were named after types (`list`, `summary`, `detail`) and two designs depended on them.**
The naming rule caught it only once enough designs pointed at each other; renaming was mechanical because names resolve, not paths.

**Fourteen patterns arrived, no new marks.**
A lifecycle came out as flows whose steps are statuses, with actions as children of a step and outside events as `->` guarded by context.
The only built-in added is `changed`, needed by two specimens.

**The first admin design found a bias.**
A setting's availability was written against `restaurant.kitchen-type`, which means nothing on a screen with no restaurant.
And a proposed `sets:` mark turned out composable: an admin screen can edit another design's field directly.

**`for:role` is the next mark, and it waits for its design.**
Who may see or do what came up in the admin specimen; it belongs with a roles and permissions specimen, not ahead of it.

**Read the canonical file, not the nearest index.**
Specimen 05's tables were wrong because they were written from a card-level index whose headers are empty, instead of the canonical file whose headers have words.
And one table with `when:` per kind forced one column order on both kinds; two tables that share a tools band is the honest shape.

## From design-agent prompt 04 — a ticket, brief to drawing

**The brief did most of the catching.**
Nine problems surfaced before any frame — a status the policy makes final, a date the product does not collect, a missing date in the record — and the screens themselves were mostly obvious from the brief.

**One loop-back, and it was a missing region.**
The details screen is one tab of a profile, and the Sema forgot the tabs; everything else the drawing needed was the binding's to decide.

**Four gaps in the language showed up at once:** no built-in for today, no way to exclude the current value from a vocabulary, `?` doing double duty for required-ness and words, and no mark for an agent's own assumption.

**Two binding holes were structural, not missing rows:** two components lived only in their own files, so no other file could draw them.

## From design-agent prompt 05 — a live-session feature

**At this size the Sema paid for itself.**
Sixteen problems were found before drawing, and defining a shared card once kept three live frames identical.

**The check passes a reference that is valid but means the wrong thing.**
A banner pointed at a search result's id; it resolved, so nothing flagged it, and only drawing showed it was the wrong record.

**Roles and live data are the two gaps that hurt.**
Roles took 23 `when:` conditions and still let one role's navigation onto another role's frames; refresh and staleness needed invented contexts.

**Names need scoping.**
Eleven screens and widgets in one design needed prefixes to stay unique, and finding names in other designs meant a search across thirty files.

## Syntax v0.8 — from runs 04 and 05 and the evaluation

**What the runs could not say became marks, and only six of them.**
`for:` for roles, `today` / `now` / durations / `.age` / `refresh:` for time, `empty:` for a missing value written once per group, `except:` for "anything but the current status", `.selected` on a list with `select:`, and `over:` with a list.
Everything else the runs asked for (a video feed, a live indicator) is a pattern, not syntax.

**Names are scoped to their anchor.**
Run 05 prefixed eleven names to keep them unique; only top-level names ever needed to be.
And a step defines nothing a screen already defines: run 05's `end-session` in two places is now a warning.

**An assumption is a provenance tag.**
`#a3` points at the brief's numbered assumption, so it needs no new mark, and a checker can still count assumed apart from sourced.

**Roles got a project-wide page before the role model settled.**
`roles.md` names the people the designs talk about; a later permission model can map onto it.

## From study 01 — Sema against a control

See [`study-01.md`](study-01.md).
On one pass from brief to drawing, Sema tied with the control (60.2 against 60.9), cost the same (56 tool calls against 57), and carried convention where the control drifted.
The early catching credited to Sema in runs 04 and 05 was mostly the brief's; the value has to be tested after the first draw.
The control's frames looked more consistent because of the drawing instructions, not the language: the Sema arm rebuilt every state from scratch where the control cloned one template.

## From laying the designs out three times in one day

**Keeping design names made the move free.**
Because references name designs, not folders, nine folders moved and not one `[[design/name]]` changed: the claim that files are only where things were written down held.

**Placement needs two rules:** a design goes where its main screen sits, and it is never split.

**The product's own table of contents was the wrong reference.**
Laying designs out by the controlled document's chapters lasted longer than by the portal's menu, but it is ordered by tasks, so one surface fell into several chapters and five folders held nothing; laying them out by product area, mirroring where the drawings already live, is what stuck.

**Specimen numbers are gone from the designs.**
Titles, descriptions and cross-references name designs, not numbers; only the reports keep the numbers they were written with.

## A list that was missing because the design pointed at it instead of holding it

**A screen whose whole purpose is a list must show the list.**
The configuration screen referred to another design's vocabulary and derived category and availability in scattered `is:` lines, so nowhere could a reader see the sixteen entries at once.
Now the data page holds every entry as a table for people and tokens for a checker.

**Reading a source once through a lossy conversion propagated three errors into two designs.**
A catalogue had misnamed two entries, merged two into one, and lost a scope; re-reading the source cell by cell fixed the vocabulary, the catalogue and the configuration together.

## One design per kind

**One design for two kinds hid how different they are.**
Every line carried `when:fulfilment=…`, and a third kind the next market needs had nowhere to go.
Now each kind is its own design, and what they share is one more design: the common record, the statuses, the review tools.

**`like:` carries the shared record, widgets carry the shared screens.**
A kind's record is `like:shared/record`; each list places `[[shared/review-tools]]`.
A reference that used to be one target is now one action refined per kind.

**The placement rule changed:** a design is still never split, but when one surface differs by kind, each kind becomes a design and the shared part one more.

## From layout references and shared components

Kept to the lessons; the mechanics belonged to one drawing tool and one library.

- A layout reference (how the shipped product already draws a design) is an audit of the product as much as a drawing aid: reading the shipped frames found three date formats, two page sizes and two names for one thing that the Sema had no way to see.
- A reference older than the design's last change is a hint only; and a reference without a check that its parts can still be imported costs a run more time than having none.
- Parts many designs share (alerts, a day-of-orders card) are components: one folder holding their Sema (kinds, data, widgets) and their binding rows; designs place their widgets and type their data with them, and never redefine them.
- Grammar friction found on the way: Sema has no way to say an enum's priority order; "an enum sorts by its values' order" is how `sort:kind` is read, and it belongs in the syntax.
- Speed rules for a drawing agent: probe scripts that return what they found even when they fail; a consistency check that compares only what each state's diff names, one pair per call; independent designs drawn in parallel.

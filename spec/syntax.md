# Sema syntax — v0.8

> v0.8 as implemented by Semark; departures are listed in [checks.md](checks.md).
> The examples are from the sample corpus in `examples/larder`: a food-delivery company, its restaurants, menus and orders.
> The language changed often before v0.8 and may change again; this file is its authority in this repository, and the code follows it.
> Version 0.8 added roles (`for:`), time (`today`, `now`, durations, `.age`, `refresh:`), `empty:`, `except:`, selection with `.selected`, `over:` with a list, names scoped to their anchor, and assumptions as `#a…`.
> Version 0.7 added `range:`, `unique:`, `covers:` and `enabled:`.
> Version 0.6 added quoted values, and the rules on what gets drawn.
> Version 0.5 added comparisons, derived values with `is:`, and anchors that add to a reference.
> Version 0.4 added unknown words, `span:`, `format:`, `like:`, filter values in states, and four written rules.
> Version 0.3 added value conditions, filter options, paging, counts, fallbacks and defaults that must exist.
> Version 0.2 added copy, states as scenarios, presentation and levels.

Prose is free.
Meaning lives in tokens.
A checker reads only the tokens; a person reads both.

## The token

```
[[name]]                          reference
[[name: type marks…]]             definition
[[name marks…]]                   reference that adds to what it points at
```

A colon after the name makes it a definition.
Without one, the token points at something defined elsewhere and may refine it — give it a pattern, a label, a transition.

One token per line where possible, so a line's history keeps one decision per line.
Text after the token on the same line is its note.

## Names and nesting

Names are kebab-case: `opening-date`, `delivery-radius`.
A name is never a type's name: `text`, `image` and `date` are taken.

A token's full path comes from where it sits.

Headings are for people and never hold a token.
A token alone on the first line under a heading is that heading's **anchor**: everything under the heading, until the next heading of the same or higher level, is its child.
An indented list item is the child of the item above it.

```
## Restaurant

[[restaurant: group]]

- [[restaurant-name: text required]]          → restaurant.restaurant-name
```

A heading with no anchor is just a heading — it groups the text for a reader and changes no path.

A reference resolves against its context first, then outward: inside `restaurant`, `[[restaurant-name]]` means `restaurant.restaurant-name` before it means any other `restaurant-name`.
Outward means the context loses its **outermost** segment first: written in `form.section`, the name `name` is tried as `form.section.name`, then `section.name`, then `name`.
That is what lets a reference anchor on one page find its group's fields defined on another.
A name that still matches two things is an error, not a guess.
Write the path to settle it: `[[contact.first-name]]`.

A name is scoped to its anchor.
Only the top-level names of a design — its flows, screens, widgets, groups, vocabularies, settings and contexts — must be unique in it.
A state, region, section, column or action belongs to the anchor it sits under, so two screens may each have a state called `empty` or an action called `close`; from outside, write the path, `[[editor.empty]]`.
Prefixes such as `ob-` or `mb-` are never needed to keep names apart.

A thing is defined where it is drawn and referred to everywhere else.
A flow's step names the screen's action, `[[send -> sent-dialog]]`; it does not define a second `send`.

## Types

| Group | Types |
| --- | --- |
| data | `text` `longtext` `number` `date` `phone` `email` `bool` `enum` `list` `confirm` `address` `image` |
| many | `collection` — the set of records a screen lists; `series` — an ordered run, such as one entry per day |
| data shapes | `group` — a named set of fields; `config` — a setting; `context` — given by where the user came from; `states` — a status vocabulary |
| flow | `flow` `step` |
| screen | `screen` `region` `section` `nav` `column` `action` `feedback` `summary` `help` `state` `fallback` — what a cell shows instead of its value |
| vocabulary | `pattern` — in `patterns.md`; `word` — shared words, in `words.md`, referred to as `[[words/close]]` |

Semark also knows `design` (the token that names a design or a named vocabulary) and `widget`.

## Marks

| Mark | Means | Example |
| --- | --- | --- |
| `\|a\|b\|` | the values of an enum or list | `enum \|thai\|italian\|` |
| `\|a=Label\|` | a value and its words on screen; without `=` the value is its own words | `\|thai=Thai\|` |
| `\|a when:expr\|` | a value that exists only when the condition holds | `\|courier when:offers-delivery\|` |
| `required` `optional` `?` | must be given, may be left, nobody has said | `date required` |
| `default:x` | what to draw while it is `?` | `? default:optional` |
| `asks:x` | who answers the `?` | `asks:product` |
| `when:expr` | condition — visibility for a field, guard for a transition | `when:offers-delivery` |
| `repeat:n..m` | how many | `repeat:0..1` |
| `of:x` | what a list, collection, series or enum is made of | `of:dish`, `of:role-names` |
| `length:n` | fixed size of a series | `length:7` |
| `where:expr` | which records a collection holds | `where:status!=archived` |
| `sort:field` | default order, ascending; `-` for descending | `sort:name`, `sort:-created-at` |
| `derived` | computed by the system, never entered | |
| `from:a,b` | shown as one value made of others | `[[full-name: text from:first-name,last-name "Name"]]` |
| `present:x` | how a screen appears: `page`, `dialog`, `panel` | `present:dialog` |
| `over:target` | what a dialog or panel sits on; a list when it opens from several places, the first drawn unless a state says otherwise | `over:form,check-details` |
| `given:expr` | on a state: what is true in it | `given:cuisine=thai&!valid` |
| `hint:"…"` | helper text under a field | `hint:"As on the licence"` |
| `error:"…"` | what the field says when it fails | `error:"Enter a postcode"` |
| `add:"…"` | the words for adding one more of a `repeat:` | `add:"Add another branch"` |
| `placeholder:"…"` | words inside an empty field | `placeholder:"Search dishes"` |
| `options:x` | on a filter, where its values come from: `values` (the field's own), `present` (those in the list), or a `@config` | `options:@platform.cuisines` |
| `select:one` / `select:many` | how many values a choice or filter takes; on a table or list, how many items can be selected, giving it `.selected` | `select:one` |
| `per:n` | items per page | `per:15` |
| `range:a..b` | the values a number may take, in its unit | `range:1..25` |
| `unique:field` | on a list: no value of that field appears twice across its items | `unique:days` |
| `covers:field` | on a list: every value of that field's vocabulary appears in some item | `covers:days` |
| `enabled:expr` | on an action or field: usable only while the condition holds; unlike `when:`, it is still shown | `enabled:valid` |
| `initial:x` | the value a field starts with — not a `default:`, which is about what nobody has decided | `initial:"11:00"` |
| `unit:x` | the unit a number is measured in; `@config` when the platform chooses | `unit:km`, `unit:@platform.currency` |
| `format:x` | how a value is written, when that is part of its meaning | `format:h:mm` |
| `like:x` | a group with all of `x`'s fields; a child of the same name replaces one | `[[owner: group like:contact]]` |
| `span:field` | the span a series covers, when another field sets it | `span:period` |
| `with:name` | on `->`: what the target is opened for, received there as a `context` | `-> dish-dialog with:dish` |
| `by:field` / `mark:field` | on a count: what it counts by, and what marks each count | `by:section mark:allergen` |
| `for:role` | shown or usable only for these roles; `,` for several, `!` for all but | `for:owner`, `for:!courier` |
| `except:x` | on a choice: the vocabulary without these values, or without a field's current value | `except:status` |
| `empty:"…"` | what a value shows when it has none; on a group, what each child shows | `empty:"Not given"` |
| `refresh:a..b` | on live data: how often it is renewed, as a duration | `refresh:2s..3s` |
| `> pattern` | refined into this interaction pattern (L3) | `> choice.single` |
| `-> target` | leads to | `-> sent-dialog` |
| `fits:type` | on a pattern: which data types it can carry | `fits:enum,bool` |
| `#ref` | provenance or constraint; `#a3` is the writer's own assumption, numbered in the brief | `#brief-4`, `#terms-2.1`, `#a3` |
| `to-be` | not in the product yet | |
| `"Label"` | the words on screen, when they differ from the name | `"Restaurant name"` |
| `"Label…"` | copy known only in part — the ellipsis is the mark | `"Your application was succ…"` |
| `"?"` | nobody has written the words yet; also `\|other=?\|` on a value | `[[cuisine: enum "?"]]` |
| bare word | a flag | `removable`, `readonly` |

The flags the language defines are `required`, `optional`, `?`, `derived`, `to-be`, `removable`, `readonly`, `sortable`, `disabled` and `row`.
A bare word that is none of these is kept on the page and flagged by the checker, because it is usually a mark with a typo or a name with a space.

## Read-only data

On data that is shown, not entered, `required` means *always present* and `optional` means *may be missing*.

## Conditions

`when:` takes field names, `=` `!=` `<` `>` `<=` `>=`, `&` for and, `,` for or, `!` for not.
`&` binds tighter than `,`: `a&b,c` means (a and b) or c.
No spaces: a value that has them is quoted, `cuisine~"Street food"`.

```
when:offers-delivery
when:cuisine=thai&offers-delivery
when:@platform.vat-required
when:!valid
```

`@name` is a `config` or `context` token — anything the user does not enter on this screen.
`valid`, `submitted`, `filtered`, `searched`, `loading` and `changed` (edits not yet saved) are built in: they describe the screen, not a field.
`empty` is a built-in value: `dishes=empty`.
`today` and `now` are built-in values: `opening-date>=today`, `published-at>=created-at`.
A duration is a number with `s`, `m`, `h` or `d`: `30s`, `2h`, `7d`.
`.age` on a value is the time since it last changed or arrived: `orders.age>30s`.
`.selected` on a table or list with `select:` is the item the user has chosen: `dishes.selected!=empty`.
In a state's `given:`, `field~value` says a filter on that field is set to that value: `given:cuisine~"Street food"&searched`.

## Deriving a value

A `derived` field can say how it is worked out, one value per line, each a reference with `is:` and a condition.
The first line whose condition holds gives the value; a line with no condition is the last resort.

```
- [[menu-state is:"Not published" when:published-at=empty]]
- [[menu-state is:"No dishes" when:dishes=empty]]
- [[menu-state is:"Live"]]
```

`.first`, `.last` and `.count` reach into a list: `dishes.first.price>0`, `dishes.count>2`.

## Adding to something defined elsewhere

An anchor can be a reference: `[[restaurant]]` under a heading adds the fields below it to the `restaurant` group defined on another page.
That is how a widget brings its own settings without defining a second group.

## Values with spaces

A mark's value that contains a space is quoted: `initial:"11:00 am"`, `default:"Clear filters"`, `is:"No dishes"`.
Values inside `|…|` need no quotes, because the bars already mark where each one ends; a space before a bar does end the list, so write `|a=A|b=B|`, never `|a=A| b=B|`.

## What gets drawn

Seven rules a renderer — a person, an agent, or a tool — follows to turn a page into a frame.

1. **A screen or widget draws its anchor's subtree, and nothing else on the page.**
   On a widget page that is the `## Card`; the `## Data` below it is definitions, never drawn.
   States are frames, never content.
2. **A reference with no pattern shows its value, as text.**
   Only `> pattern` makes a control; an enum shown on a read-only screen is its value, not a choice.
3. **A pattern's children are its content.**
   The figure under a `summary.tile` is the tile's figure; the columns under a `table` are its columns.
4. **Names in a condition resolve from where the condition is written**, exactly like references.
   `when:offers-delivery` inside the `restaurant` group means `restaurant.offers-delivery`, wherever the field is later shown.
5. **A widget with no states of its own is drawn in each state of the screen that places it.**
6. **Only screens and widgets are frames.**
   A `design` page is drawn as a map — its flows, the steps of each, and the screens they reach; a `flow` page as a graph of its steps; `data`, `config`, `states`, `patterns` and `words` pages as lists, never as a frame.
7. **Only what a user sees has words.**
   A design, a flow, a step, a group or a vocabulary is never on screen, so it is never hatched for having no words; the text after its token is its description.

## Words that carry values

A label, hint or error can hold a value in braces: `"Dishes ({dishes.count})"`, `"Last order {last-order}"`.
Every name in braces must resolve like a reference.
`.count`, `.first`, `.last` and `.label` are built in: the size of a list, its ends, and the words of a token.

## Refining under a condition

A reference with `when:` refines what it points at only while the condition holds.
So one field can have two labels, `[[licence-number "Food licence" when:cuisine=thai]]` and `[[licence-number "Trading licence" when:cuisine=other]]`, or two patterns, one per case.

## Roles

A role is a value of `@user.role`, defined once for the corpus in `roles.md`: the `user` context, its `role` field and the `role-names` vocabulary.
`for:` on a token says which roles see it or can use it; it means the same as `when:@user.role=…`, but a checker can collect it, so what one role sees can be listed in one place.

```
- [[payouts for:owner]]
- [[menu-card for:staff]]
- [[publish for:owner,staff]]
```

`for:` on a screen also tells the binding which shell to draw it in.
A state says its role in `given:`, `given:@user.role=owner&…`, so every frame is drawn for one role.
A token without `for:` is for every role that can reach its screen.

## Time and live data

Dates compare with `today`; moments with `now`.
Data that renews by itself says how often, `refresh:2s..3s`, and each value carries `.age`.
Stale data is a condition, not a new field: `[[stale-notice: help > notice.warning when:orders.age>30s]]`, and a state that draws it, `given:orders.age>30s`.
A timeout is a transition guarded by a duration: `[[waiting -> unanswered when:waiting.age>60s]]`.

## Empty values and selection

`empty:"…"` says what a value shows when it is missing.
On a group it applies to every child, so a details card of nine values writes "Not given" once.
A `fallback` is different: it replaces a whole cell or card.
How a missing value looks when no `empty:` is written is the binding's convention.

A table or list with `select:one` has `.selected`, the item chosen.
Another part of the screen refers to it, `[[dish-detail: section of:dishes.selected when:dishes.selected!=empty]]`, and a state chooses it, `given:dishes.selected=dishes.last`.

## Assumptions

A decision the writer made because no source did is tagged with the brief's number, `#a3`, beside the token.
It is settled for drawing, unlike `?`, but a checker counts it separately from what the sources say.

## Copy

A word nobody has written is `"?"`, never invented and never left out: a drawing agent draws a placeholder and lists it.
Copy known only in part (`"…succ…"`) is drawn as known, with its ellipsis, and never completed.
An action with no words — an icon-only control included — still needs words, for the people who cannot see the icon.

Every word a user reads is a label, a `hint:`, an `error:` or the label of a value.
A word that is not written down is not known, and a drawing agent marks it as invented.
How a required field shows that it is required — an asterisk, "(optional)" on the others — is the binding's choice, not the design's.

## States are scenarios

A state is one frame's worth of truth.
`given:` says what holds in it — which values are chosen, which settings are on, whether the screen is valid.
Everything not given is as it starts: nothing entered, settings as the design assumes.

A frame draws every field whose `when:` is true under its state's `given:`.
So an `empty` state that wants a conditional field visible says so: `given:offers-delivery`.

Children of a state are what that state adds — a banner, a message — and nothing else.

The states of a screen are its frames: write one for every scenario worth drawing, and no more.
A state the sources do not have is `?`, with `default:draw` or `default:skip`.

A `fallback` is not a state: it is what one cell shows instead of its value, and it carries its own `when:`.

## Defaults and sources

A `default:` names something that exists: a value of the field, a pattern, or `draw` / `skip` on a state.
A default nothing defines is an error, because only the binding could guess what it means.

When a controlled source (`#terms-2.1`) and a drawing disagree, the design follows the controlled source and says so in a note beside the token.

## Inheritance

A reference inherits its definition's `when:`; its own `when:` narrows it further, as if joined with `&`.
A `fallback` replaces a card's content and keeps the card's heading and the heading's actions.
A sortable column starts in the order of its collection's `sort:`.
A section with `->` opens from its heading: the heading is the control.
A value made of several numbers — opening hours — is a group, and a series of them uses `like:` to keep the group's other fields.

A field inside a group applies only when the group is present; the group's `required` says whether it must be.
A field gated by a `to-be` setting is `to-be` itself.
Order of tokens is reading order; where regions sit on the screen is the binding's choice.

## Levels

| Level | A page has reached it when it has |
| --- | --- |
| L0 | a sentence of intent |
| L1 | steps and the transitions between them |
| L2 | fields with types, required-ness and conditions |
| L3 | a pattern on every field and action it shows |
| L4 | regions, sections and states with `given:` |

`level:` in frontmatter is the highest level the page reaches throughout.

## Files

How pages, frontmatter and names across designs work is in [structure.md](structure.md).
In short: the host application owns `id` and the rest of the frontmatter; Sema adds `sema:` and `level:`; names resolve across the whole design; and a name in another design is written `[[design/name]]`.
A reference to a design not written yet is a forward reference, which is normal while a design is young.
Any other name that resolves to nothing is an error.

## Checks

Every file must pass these, whoever reads it — a person, an agent, or a tool.
What the checker does with each is in [checks.md](checks.md).

| Rule | Severity |
| --- | --- |
| reference resolves to nothing | error |
| reference matches more than one thing | error |
| a top-level name defined twice in one design | error |
| a step that defines an action, field or screen already defined on a screen | warning — refer to it instead |
| a reference that resolves into a different group than the references beside it | warning — it may mean the wrong thing |
| `for:` names a role the roles vocabulary lacks | error |
| `except:` names something outside the choice's vocabulary | error |
| a duration without its unit | error |
| `.selected` on a list with no `select:` | error |
| unknown type, or a pattern not in the vocabulary | error |
| `when:` names a field or config that does not exist | error |
| `when:` compares an enum to a value it does not have | error |
| `default:` names nothing defined | error |
| a number, count or size written only in prose | warning |
| `"?"` words, or an action with no words | warning, counted per screen as *unknown words* |
| `nav.pages` with no `per:` | warning |
| a mark's value with a space, not quoted | error |
| a definition outside the anchor's subtree on a screen or widget page, under no `## Data`-style heading | info — it will not be drawn |
| a reference whose own `when:` contradicts its definition's | error |
| pattern does not fit the field's type | warning |
| `?` with no `default:` | warning |
| `#a…` assumptions | info, counted per screen |
| a file id that is not written yet | info — normal at L1 |

A screen is **ready** when every field it shows is settled or has a default, and it has no unknown words.

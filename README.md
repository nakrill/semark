# Semark

**Sema** is a way of writing a product design in Markdown so that a program can check it.
Screens, fields, actions and states are named in `[[double brackets]]`; the prose around them stays prose.
A checker reads only the tokens and says what is defined, what refers to what, and what is still open.
**Semark** is the language's home: its specification, the one parser and checker, a command line, the sample corpus and the record of the experiment that made it.

```
## Checkout

[[checkout-screen: screen present:page for:customer "Checkout"]]

- [[order.delivery-time > choice.single]]
- [[order.delivery-slot > choice.dropdown]]                       shown only when the time is "later"
- [[place-order: action > action.primary "Place order" -> order-screen enabled:valid]]
- [[cash-note: help > notice.info "Have the exact amount ready." when:order.payment=cash]]

## States

- [[missing-address: state given:!valid&submitted]]
```

Three conventions carry the language's purpose:

- a word nobody has written is `"?"`, never invented, and it blocks a screen from being *ready*;
- an open decision is `?`, with who answers it (`asks:`) and what to draw meanwhile (`default:`);
- a name resolves or it is an error; an ambiguous name is an error naming both candidates, never a guess.

Sema describes a design by meaning, never by look.
Colour, type and pixels belong to a **binding**, which maps patterns such as `choice.single` to a design system's components.

## Try it

```sh
npm install            # nothing to install but the workspace itself; the library has no dependencies
npm test               # 48 tests, numbers worked out by hand before the code
npm run check          # the sample corpus: 4 designs, 29 pages, 0 errors, and the open questions it keeps on purpose

node packages/semark/bin/semark.js check examples/larder          # problems with file:line, readiness per screen; exit 1 on errors
node packages/semark/bin/semark.js check examples/larder --json
node packages/semark/bin/semark.js dump examples/larder            # the resolved model: definitions, diagnostics, readiness, drawings
```

A corpus is a folder that holds `patterns.md` (and `words.md`, `roles.md`) and, under it, designs: folders whose `index.md` says `sema: design`.

## In the repository

| Path | What |
| --- | --- |
| [`spec/syntax.md`](spec/syntax.md) | the language, v0.8: tokens, names, types, marks, conditions, what gets drawn, levels, checks |
| [`spec/structure.md`](spec/structure.md) | designs as folders, which pages take part, the corpus root, names across designs, reading order |
| [`spec/drawing.md`](spec/drawing.md) | the rules a renderer follows and what a binding provides |
| [`spec/checks.md`](spec/checks.md) | every rule, its severity, the diagnostic code and the test that pins it |
| [`spec/decisions/`](spec/decisions/) | choices that are not the spec's plain word, and the open questions |
| [`packages/semark/`](packages/semark/) | the library (`src/`: token, page, model, condition, check, complete, view, corpus) and the `semark` command |
| [`packages/mcp/`](packages/mcp/) | the same as tools for agents over the Model Context Protocol: `semark_check`, `semark_page`, `semark_dump` |
| [`schema/`](schema/) | JSON Schema for what `semark check --json` prints |
| [`bindings/`](bindings/) | the reference wireframe binding as data, and what a binding is |
| [`examples/larder/`](examples/larder/) | the sample corpus: a food-delivery company's onboarding, menu builder, ordering and browsing designs |
| [`examples/minimal/`](examples/minimal/) | the smallest design that says something |
| [`skills/`](skills/) | what an agent needs to write, check and draw from Sema, and the rules for an HTML prototype |
| [`studies/`](studies/) | what the specimens taught, the controlled study, and the build test of October 2026 |
| [`test/`](test/) | the corpus tests and the two fixture corpora (traps, and one page per value rule) |

## Using the library

```js
import { loadCorpus, checkCorpus, viewOf } from 'semark';

const { corpus } = await loadCorpus('examples/larder');
const results = checkCorpus(corpus);                 // per design: diagnostics with file and line, readiness per screen
const drawing = viewOf(corpus, 'ordering/checkout-screen.md');   // frames per state, as plain data
```

The library has no dependencies and runs in Node and in a browser.
Nothing in it ever writes a token back: a page is read, never re-serialised, so an editor built on it can promise that opening and saving changes no bytes.

## Where it came from

Sema was written in October 2026 for a real product, one specimen at a time, by a designer and an agent, and rewritten after every agent run and every renderer pass; [`studies/learnings.md`](studies/learnings.md) is that record with the product's names taken out.
It sits in the tradition of model-based user interface languages (UIML, UsiXML, IFML), rewritten for Markdown, git and readers that are language models.
What is its own is treating words, open questions and assumptions as checkable, countable parts of the model.

The first editor that understands Sema is [Vouch](https://vouchdocs.dev), which draws tokens as chips, shows the wireframe beside the page and keeps one decision per line under git.

## Licence

Apache-2.0.

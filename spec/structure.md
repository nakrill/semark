# Sema structure

> The parts of Sema's structure rules that Semark implements.
> Components, layout references and bindings beyond the reference wireframe binding are not part of it; an editor adds its own.
> The token grammar is in [syntax.md](syntax.md); what the checker reports is in [checks.md](checks.md).

## A design is a folder

A design is a folder whose `index.md` says `sema: design` in its frontmatter.
The design is named by the `[[name: design]]` token on that page; with no such token, by the folder's name.
Every page under the folder belongs to the design, including pages in its sub-folders, unless a nearer folder is a design of its own.
A design name belongs to one folder: when two folders declare the same name, the first (by path) keeps it, and the second is reported as `design-twice` and takes no part until it is renamed.

A design can start as one `index.md` with one sentence of intent.
Its flows, screens and data become sub-pages as they grow, and nothing that refers to them has to change: names belong to the design, not to the file.

## Which pages take part

A page takes part in Sema when its frontmatter says `sema:` and one of these kinds:

| `sema:` | What the page is |
| --- | --- |
| `design` | a design's intent, its flows by name; only on a design folder's `index.md` |
| `flow` | steps and branches |
| `screen` | one screen, drawn as a frame |
| `widget` | a part of a screen with its own data, drawn as a frame |
| `data`, `config`, `states` | what the screens show and depend on |
| `patterns`, `words`, `roles` | the shared vocabulary |

The frontmatter is read only at the top of the file; a line `sema: …` further down is text.

## The corpus root

The corpus root is the nearest folder above a page that holds `patterns.md`.
Everything under it is read together: the shared vocabulary and every design.
A design needs a `patterns.md` above it; a Sema page with none still shows its tokens as chips, but the editor says that no vocabulary was found, and nothing is checked against one.

The vocabulary lives at the root, beside `patterns.md`:

| Page | What it holds | Referred to as |
| --- | --- | --- |
| `patterns.md` | the interaction patterns, each with `fits:` | `> choice.single` |
| `words.md` | shared words, under `[[words: design]]` | `[[words/close]]` |
| `roles.md` | the `user` context, its `role` field and the `role-names` vocabulary, under `[[roles: design]]` | `for:owner` |

A vocabulary page with a `[[name: design]]` token is addressed by that name, `[[words/close]]`.
A vocabulary page with no such token is reached by the full path of its definitions, and only if it says `sema:`.
A page with no `sema:` contributes no names at all, even if it holds tokens: a README that shows `[[email: text]]` as an example defines nothing.

## Names across designs

A name resolves across the whole design, whichever page it was written on.
Only a design's top-level names must be unique in it; a state, region, section, column or action belongs to the anchor it sits under.

A name in another design is written `[[design/name]]` or `[[design/path.to.name]]`.
A reference to a design that does not exist yet, or to a name not yet written in one, is a forward reference: reported as information, not an error.
A name written kind-first, `[[screen.welcome]]`, is a forward reference too while it does not exist.

The design token itself is reached only from outside: `[[onboarding/onboarding]]` from another design.
Inside its own design, a bare `[[onboarding]]` does not mean the design.

## Widgets

A widget is a part of a screen that carries its own data.
A widget page has a `## Card` with the card's anchor, and a `## Data` with what only that card uses.
The screen places it by referring to the anchor, in the order it should appear.
Only the card is drawn; the data is definitions.

## Reading order

Page titles carry no numbers: order is part of the design, not of the file names.
A design is read in the order its kinds depend on each other:

1. the `design` page — the intent, and the flows by name;
2. `flow` pages — steps and branches;
3. `data`, `config` and `states` pages — what the screens show and depend on;
4. `screen` pages, in the order the flows reach them, the first step's screen first, each followed by the widgets it places; screens no flow reaches come after, by name;
5. everything else.

The order is worked out from `sema:` and from the flows' `->` transitions, so it stays right when a page is added, split or renamed.
`semark dump` reports it, the design's map uses it, and an editor may list a design's pages in this order.

## Frontmatter

The host application owns `id` and whatever else it keeps in frontmatter; Semark never reads or writes them.
Sema adds two keys of its own and no others:

```
---
id: k3x9wq2mz7rd
sema: screen
level: 3
---
```

`level:` is the highest level the page reaches throughout; the checker works it out from the tokens and warns when the frontmatter claims more.

## The drawing pane

The reference binding is the wireframe: what an editor draws beside a Sema page.
It maps patterns to shapes through the `WIREFRAME_BINDING` table in `packages/semark/src/view.js` (also as data in `bindings/wireframe.json`), matched by prefix, longest first; `drawing.md` has the contract a binding follows.
A pattern the vocabulary gains still lands somewhere sensible; a new shape is added there, never hidden in a renderer.

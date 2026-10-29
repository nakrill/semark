# What gets drawn

> The rules a renderer follows to turn a Sema page into a frame, and what a binding must provide.
> The seven rules are the language's (see [syntax.md](syntax.md), *What gets drawn*); this page says how Semark applies them and what is left to a binding.
> `packages/semark/src/view.js` builds the drawing as plain data; it knows nothing about a screen, a canvas or a framework.

## The page's kind decides the drawing

The kind is read first, so a flow is never pushed through the screen renderer.

| `sema:` | Drawn as |
| --- | --- |
| `screen`, `widget` | frames: one sheet per screen on the page, one frame per state |
| `flow` | a graph of its steps; a step not written yet is dashed, one in another design is shaded |
| `design` | a map: its flows, every screen with its readiness, the screens no flow reaches, and what is named but not written |
| anything else | a list of its definitions, with what the checker says about each row |

## Frames

1. A screen or widget draws its anchor's subtree, and nothing else on the page.
   A widget's `## Data` is definitions and is never drawn; states are frames, never content.
2. A reference with no pattern shows its value as text; only `> pattern` makes a control.
3. A pattern's children are its content: a table's columns, a tile's figure.
4. A condition is resolved where it was written.
   Conditions are three-valued: a condition the state settles hides or shows; one the frame does not track is drawn with the condition beside it, never hidden on a guess.
5. A widget with no states of its own is drawn in each state of the screen that places it.
6. Only screens and widgets are frames.
7. Only what a user sees has words.
   Words nobody has written are a hatch with the thing's name in it; partial words keep their ellipsis.

And four more that the first renderers needed:

8. The chosen value of a choice follows `given:`, then `initial:`, then the first value.
9. A frame whose `given:` says `!valid` draws the required fields it shows as failing.
10. `like:` copies the whole subtree of what it points at, nested groups included; a child of the same name replaces one.
11. `empty:` shows its words where a frame says the value is missing; a frame for one role leaves out what is not `for:` it.

## The binding

A binding maps patterns to shapes and carries the conventions the design leaves open.
Semark ships one, the **wireframe**, as `WIREFRAME_BINDING` in `view.js` and as data in [`bindings/wireframe.json`](../bindings/wireframe.json).

A binding row is `[pattern prefix, shape, variant?]`, matched by the longest prefix first, so `input.text.long` wins over `input.text`, and a pattern the vocabulary gains tomorrow still lands on the nearest row.
A pattern with no row at all is drawn as an unbound box carrying the pattern's name, never as a control, so a read-only pattern can never turn into an input by accident.
A reference with no pattern is drawn by its type: a container for groups, sections and regions; a quiet button for an action; a feedback block for feedback; a value for everything else.

A binding also owns the conventions the design never states: how a required field is marked, how a missing value looks when no `empty:` is written, date and number formats, units after values, the shell a screen sits in and where its regions go.
A renderer that has no binding chooses these once, uses them everywhere, and writes them down.

Clicking anything in a drawing should put the cursor on the line it was written on; the drawing follows the text as it is typed, before it is saved, and nothing is ever written back.

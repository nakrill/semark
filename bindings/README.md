# Bindings

A binding maps patterns to the shapes that draw them and carries the conventions a design leaves to the look: the required marker, the missing value, formats, units, the shell.
One binding per design system; the design never names a component.

`wireframe.json` is the reference binding, generated from `WIREFRAME_BINDING` in `packages/semark/src/view.js`: rows of `[pattern prefix, shape, variant]`, matched by the longest prefix first.
A pattern with no row is drawn as an unbound box with the pattern's name, never as a control.
The contract a binding follows is in [`spec/drawing.md`](../spec/drawing.md).

To add a binding for a design system, write its rows against the same pattern vocabulary, add a *Conventions* section for what the design leaves open, and keep it beside the design system, not inside any design.

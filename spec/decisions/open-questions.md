# Open questions

- **An enum has no order.** "An enum sorts by its values' order" is how `sort:kind` on a status is read today; nothing in the syntax says so.
- **No "one of this collection" choice.** A field that must name one line of an order (which dish was missing) is free text, because there is no type for a choice among a collection's items.
- **Accessors after a cross-design path.** `{ordering/basket.count}` does not resolve: the resolver gives up on a name with `/` before the path walk. The workaround is a derived field in the referring design.
- **`where:` and `sort:` are not checked.** Their names are kept and drawn but never resolved.
- **Heading reach and forward references by bare name.** How far a heading's anchor reaches past a list, and whether a bare name may point at a definition further down the same page, are not settled.
- **Completeness.** Every gap found by building from a design was an absence: a field collected in a dialog that no record keeps, an action with neither `->` nor an effect, a state with no visible content, a flow with no way back. Rules for these are not written.

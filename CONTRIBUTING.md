# Contributing

- The spec is the authority: a change to behaviour starts in `spec/`, and `spec/checks.md` gains or changes a row before `check.js` does.
- Every rule is pinned by a test whose numbers were worked out by hand before the code; `npm test` stays green on `main`.
- The library never writes a token back and never re-serialises a page.
- The sample corpus is the only corpus: examples come from `examples/larder`, never from a real product.
- One sentence per line in Markdown, plain declarative sentences, British spelling.
- Commits say what changed in their first line; an agent commits under its own identity with a `Run-by:` trailer naming the person who ran it.

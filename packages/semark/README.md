# semark

The Sema language: Markdown with the design's decisions in `[[double brackets]]`, one parser, a checker that says what is still open, and what gets drawn.

```sh
npx semark check docs/design           # every design under the corpus root: problems with file:line, readiness per screen; exit 1 on errors
npx semark check docs/design --json
npx semark dump docs/design            # the resolved model as JSON
```

```js
import { Corpus, checkCorpus, viewOf } from 'semark';        // runs in Node and in a browser
import { loadCorpus } from 'semark/corpus.js';               // reading a folder needs Node

const { corpus } = await loadCorpus('docs/design');
const results = checkCorpus(corpus);
const drawing = viewOf(corpus, 'ordering/checkout-screen.md');
```

No dependencies.
Nothing in it writes a token back.
The language, its rules and the diagnostic codes are documented in the repository: https://github.com/nakrill/semark

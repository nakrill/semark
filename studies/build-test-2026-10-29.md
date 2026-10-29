# Build test — an agent builds from Sema, 29 October 2026

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, the night it happened.
One agent, one night, one sample corpus; a rehearsal of the second-pass study, not the study itself.
Nothing here has been checked by a person.
:::

## What was done

Four rounds on the sample corpus, every design change written through an editor as the agent (twenty commits under the agent's own name, each naming the person who ran it; nothing edited by hand):

1. A first prototype of the ordering flow (basket, checkout, order status) from its seven pages alone, as one HTML page with no design system.
2. Two one-line changes: a field made required, a Remove action added to the basket.
3. One cross-cutting change: collection instead of delivery, touching the data page, both screens and the status vocabulary, with value-level `when:` on four statuses.
4. A wide extension written in Sema first (a new browse design with three screens and a dialog; a report-a-problem flow with a refund worked out from the refunds policy; 8 new pages, 133 tokens), then built: six screens, two dialogs and a support role in one page.

## What was measured

| What | Result |
| --- | --- |
| Reading the design | one pass of about 200 lines per design; no word a customer reads had to be invented; the one unwritten word drew as a hatch |
| Decisions the design did not make | 13 on the first flow, 19 on the full one; about a third are binding conventions, the rest are gaps |
| Propagating a change | about one prototype edit per changed Sema line, every edit traceable by name; a `when:` on a definition hid a section on a screen written on another page without that page changing |
| The checker on the wide round | 14 errors caught before anything was saved, two with the cause named; one planted slip missed (a status value the enum lacks), since fixed |
| Gaps only building found | a field collected in a dialog with no record to keep it; a basket from two restaurants; a state with no visible content; an action with no outcome; no step back in the flow; an accessor after a cross-design path |

## Outcomes

1. The benefit for agents is real and it is not the first draw: reading is cheap and unambiguous, but the first prototype still needed thirteen decisions the design did not make, which matches the controlled study's tie. The gain shows on the second pass, where a change lands where its name is.
2. Strictness is where the value comes from: everything that helped was a rule that bit; everything that hurt was silence.
3. The checker cannot see absence: every design gap was something not written. Completeness rules (a dialog collecting what no record keeps, an action with neither `->` nor an effect, a state that adds nothing visible, a flow with no way back) are the next rules to write.
4. The editor underneath did its part: it refused to save over a stale clone, every commit names the agent and the person who ran it, and opening and saving changed no bytes.
5. Still owed: the second-pass study with a control (`study-01.md`, *Study 02*), and the language's own gaps (`spec/decisions/open-questions.md`).

## The seven-mistake probe

A data page planting seven writer mistakes (a name with a space, a capitalised type, a case mismatch, no space after a colon, a value list cut by a space, a second label, a type used as a name) produced one diagnostic before the checker was made strict and seven after.
It is kept as `test/fixtures/corpus/onboarding/mistakes.md`.

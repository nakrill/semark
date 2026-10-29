---
id: yhkhc56f7kqv
kind: note
sema: screen
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Dialogs

## Discard

[[discard-dialog: screen present:dialog over:form "Discard your application?"]]

- [[confirm-discard: action > action.primary "Discard"]]
- [[keep: action > action.dismiss "{words/cancel}"]]

## Sent

[[sent-dialog: screen present:dialog "?"]]

- [[sent-message: feedback > feedback.success "We will review your application within two days."]]
- [[close: action > action.dismiss "{words/close}"]]

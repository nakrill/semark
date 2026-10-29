---
id: m31xf5rkqtgd
kind: note
sema: patterns
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Patterns

A pattern names what the control does, never which component draws it.

## Input

- [[input.text: pattern fits:text]] free text, one line
- [[input.phone: pattern fits:phone]]
- [[input.email: pattern fits:email]]
- [[input.date: pattern fits:date]]
- [[input.number: pattern fits:number]] a number, with its unit and allowed range

## Choice

- [[choice.single: pattern fits:enum]] pick one
- [[choice.binary: pattern fits:bool]] yes or no

## Screen

- [[summary.key-value: pattern fits:summary,group]] read-only label and value pairs
- [[feedback.success: pattern fits:feedback]] a completed action, stated
- [[action.primary: pattern fits:action]] the main thing to do
- [[action.secondary: pattern fits:action]] an alternative
- [[action.dismiss: pattern fits:action]] a way out
- [[notice.info: pattern fits:help]] information shown in place

## Lists

- [[table: pattern fits:collection,series,list]] one row per item, one column per column token
- [[status.badge: pattern fits:enum]] the current value of a status vocabulary, as a short label

---
id: bttnfkhvpm25
sema: patterns
status: ready
owner: tomas@larder.example
description: The interaction patterns Larder's designs may use
area: Design
---

# Patterns

A pattern names what a control does, never which component draws it.
A pattern is added when a design needs it, never in advance.

## Input

- [[input.text: pattern fits:text]] one line of free text
- [[input.text.long: pattern fits:longtext]] several lines of free text
- [[input.email: pattern fits:email]]
- [[input.phone: pattern fits:phone]]
- [[input.number: pattern fits:number]] a number, with its unit and range
- [[input.date: pattern fits:date]]
- [[input.time: pattern fits:text]] a time of day, in its format
- [[input.search: pattern fits:text]] free text that narrows a list as it is typed
- [[upload.image: pattern fits:image]] a photo from the phone or the computer

## Choice

- [[choice.single: pattern fits:enum]] pick one of a few, all visible
- [[choice.dropdown: pattern fits:enum]] pick one of many
- [[choice.binary: pattern fits:bool]] on or off
- [[choice.confirm: pattern fits:confirm]] the user states that something is true
- [[choice.chips: pattern fits:list]] pick several short values

## Groups

- [[group.address: pattern fits:address,group]] a known set of address fields

## Lists

- [[table: pattern fits:collection,list]] one row per item, one column per column token
- [[list.cards: pattern fits:collection,list]] one card per item
- [[filter.choice: pattern fits:enum]] narrow a list by one field's values

## Screen

- [[summary.key-value: pattern fits:summary,section,group,region]] read-only labels and values
- [[summary.total: pattern fits:number]] a total that stands out
- [[status.badge: pattern fits:enum]] the current value of a status, short
- [[list.timeline: pattern fits:collection,list]] what happened, newest last
- [[notice.info: pattern fits:help]] information that stays in place
- [[notice.warning: pattern fits:help]] something the reader must not miss
- [[feedback.success: pattern fits:feedback]] a finished action, stated
- [[feedback.empty: pattern fits:feedback]] nothing to show yet, and why
- [[nav.steps: pattern fits:nav]] the steps of a process, the current one marked
- [[nav.jump: pattern fits:nav]] jump to a part of the page
- [[nav.pages: pattern fits:nav]] one page of a long list at a time
- [[action.primary: pattern fits:action]] the main thing to do
- [[action.secondary: pattern fits:action]] another thing to do
- [[action.dismiss: pattern fits:action]] a way out
- [[action.danger: pattern fits:action]] something that cannot be undone

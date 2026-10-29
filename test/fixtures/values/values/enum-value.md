---
id: ztnen0pmqk0w
kind: note
sema: screen
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-29, as a neutral test corpus for Sema's value-level checks in Vouch.
Nothing here has been checked by a person.
:::

# Enum value

[[enum-value: screen]]

- [[cuisine > choice.single]]
- [[thai-help: help "Say how hot each dish is" when:cuisine=thai]] right: thai is a value of cuisine
- [[french-help: help "Name the region" when:cuisine=french]] wrong: cuisine has no value french

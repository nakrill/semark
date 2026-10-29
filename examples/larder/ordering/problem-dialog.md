---
id: erdhjf9xpgvy
sema: screen
status: in-review
description: Telling Larder what went wrong with an order, and what we refund
area: Design
---

::: note
Written by an agent (Claude), run by Ivan Aleksieiev, 29 October 2026, to widen the ordering flow for a coverage test of Sema in Vouch.
Nothing here has been checked by a person.
:::

# Report a problem

[[problem-dialog: screen present:dialog over:order-screen for:customer "What went wrong?"]]

## What happened

[[problem-section: section]]

- [[problem.problem-kind > choice.single]]
- [[problem.which-dish > input.text]]
- [[problem.note > input.text.long]]
- [[problem.photo > upload.image]]

## What we refund

[[refund-section: section "What we refund" > summary.key-value]]

- [[problem.refund-amount]]
- [[refund-note: help > notice.info "We answer within two working days."]] #refunds
- [[other-note: help > notice.info "?" when:problem.problem-kind=other]] the words for problems the policy does not cover are with operations

## Actions

[[problem-actions: region]]

- [[send-problem: action > action.primary "Send" -> order-screen enabled:valid]]
- [[close-problem: action > action.dismiss "{words/cancel}" -> order-screen]]

## States

- [[choosing: state given:!submitted]]
- [[never-arrived: state given:problem.problem-kind=never-arrived&!submitted]]
- [[missing: state given:problem.problem-kind=missing-dish&!submitted]]
- [[something-else: state given:problem.problem-kind=other&!submitted]]

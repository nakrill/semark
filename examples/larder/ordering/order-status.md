---
id: ky5vb78rfvqr
sema: screen
status: in-review
owner: tomas@larder.example
description: Following an order until it is at the door
area: Design
---

# Order status

[[order-screen: screen present:page for:customer,support "Your order"]]

## Status

[[status-section: section]]

- [[order.order-number]]
- [[order.order-status > status.badge]]
- [[on-the-way-note: help > notice.info "Your courier is on the way." when:order.order-status=on-the-way]]
- [[ready-note: help > notice.info "Your order is ready to collect." when:order.order-status=ready]]
- [[late-note: help > notice.warning "?" when:order.order-status=preparing&order.late]] the words for a late order are still being written with operations

## What happened

[[order-events > list.timeline]]

- [[event-status]]
- [[happened-at]]

## Help

[[help-actions: region]]

- [[cancel-order: action > action.danger "Cancel order" enabled:order.order-status=placed]]
- [[report-problem: action > action.secondary "Report a problem" -> problem-dialog when:order.order-status=delivered,order.order-status=collected enabled:problem.can-ask]]
- [[contact-support: action > action.secondary "Contact support"]]

## For support

[[support-tools: region for:support "Support"]]

- [[order.payment]]
- [[order.delivery-address]]
- [[problem.problem-kind]]
- [[problem.refund-amount > summary.total]]
- [[refund: action > action.danger "Refund {problem.refund-amount}" for:support enabled:problem.refund-amount>0]]

## States

- [[just-placed: state given:order.order-status=placed]]
- [[cooking: state given:order.order-status=preparing]]
- [[on-its-way: state given:order.order-status=on-the-way]]
- [[ready-to-collect: state given:order.order-status=ready&order.fulfilment=pickup]]
- [[delivered: state given:order.order-status=delivered]]
- [[problem-reported: state given:order.order-status=delivered&problem.problem-kind!=empty]]
- [[support-view: state given:@user.role=support&order.order-status=delivered&problem.problem-kind!=empty]]

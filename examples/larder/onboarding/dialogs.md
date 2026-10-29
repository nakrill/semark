---
id: nejap27khtzg
sema: screen
status: ready
owner: tomas@larder.example
description: The two dialogs of sign-up
area: Design
---

# Dialogs

## Leaving

[[discard-dialog: screen present:dialog over:form "Leave without sending?"]]

- [[discard-note: help > notice.info "What you entered is not kept."]]
- [[keep-editing: action > action.primary "Keep editing" -> form]]
- [[discard: action > action.danger "Leave"]]

## Sent

[[sent-dialog: screen present:dialog over:check-details "Application sent"]]

- [[sent-message: feedback > feedback.success "We review new restaurants within two working days. You can start on your menu now."]]
- [[start-menu: action > action.primary "Start your menu" -> menu-builder/editor]]

---
sema: screen
---

# Who

[[who: screen present:page "Who are you?"]]

## Ask

[[ask: section]]

- [[visitor-name: text required "Your name" placeholder:"Anna"]]
- [[say-hello: action > action.primary "Say hello" -> greeted enabled:valid]]

## States

- [[blank: state given:!submitted]]
- [[missing-name: state given:!valid&submitted]]

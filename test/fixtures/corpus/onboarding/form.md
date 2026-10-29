---
id: rrtv9f0nr096
kind: note
sema: screen
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Form

[[form: screen present:page for:owner]]

## Restaurant

[[restaurant-section: section "Your restaurant"]]

- [[restaurant.name > input.text]]
- [[email-address > input.email]]
- [[restaurant.phone-number > input.phone]]
- [[cuisine > choice.single]]
- [[offers-delivery > choice.binary]]
- [[delivery-radius > input.number]]
- [[opening-date > input.date required]]

## Contact

[[contact]]

- [[first-name > input.text]]
- [[last-name > input.text]]
- [[mobile > input.phone]]

## Opening hours

[[opening-hours-card]]

## Signature

[[billing-contact.signed-at]] shown once the owner has signed

## Actions

[[actions: region]]

- [[submit: action > action.primary "Send application" enabled:valid]]
- [[save-draft: action > action.secondary "?"]]
- [[cancel-button: action > action.dismiss "{words/cancel}"]]

## States

- [[empty: state given:!submitted]]
- [[invalid: state given:!valid&submitted]]
- [[delivering: state given:offers-delivery]]
- [[approved-preview: state ? default:skip]]

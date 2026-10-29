---
id: m034ty59554s
sema: screen
status: in-review
owner: tomas@larder.example
description: The sign-up form a restaurant owner fills in
area: Design
---

# Sign-up form

[[form: screen present:page for:owner "Tell us about your restaurant"]]

One page, no steps: most owners finish it in under five minutes.

## Restaurant

[[restaurant-section: section "Your restaurant"]]

- [[restaurant.name > input.text]]
- [[restaurant.kitchen-type > choice.dropdown]]
- [[restaurant.offers-delivery > choice.binary]]
- [[restaurant.delivery-radius > input.number]]
- [[restaurant.opening-date > input.date]]
- [[restaurant.vat-number > input.text]]

## Contact

[[contact-section: section "Who we talk to"]]

- [[contact.first-name > input.text]]
- [[contact.last-name > input.text]]
- [[contact.email-address > input.email]]
- [[contact.mobile > input.phone]]

## Opening hours

[[opening-hours-card]]

## Terms

[[terms-section: section "Terms"]]

- [[agreement > choice.confirm]]

## Actions

[[actions: region]]

- [[continue: action > action.primary "Continue" -> check-details]]
- [[leave: action > action.dismiss "{words/cancel}" -> discard-dialog]]

## States

- [[empty: state given:!submitted]]
- [[delivering: state given:restaurant.offers-delivery&!submitted]]
- [[invalid: state given:!valid&submitted]]
  - [[form-errors: help > notice.warning "Some answers are missing. They are marked below."]]

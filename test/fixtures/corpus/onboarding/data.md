---
id: xvrse8t59c0g
kind: note
sema: data
---

::: note
Written by an agent (Claude), run by Ivan, 2026-10-21, as a neutral test corpus for Sema in Vouch.
Nothing here has been checked by a person.
:::

# Data

## Restaurant

[[restaurant: group]]

- [[name: text required "Restaurant name"]]
- [[email-address: email ? hint:"Where orders are confirmed"]]
- [[phone-number: phone ? default:optional]]
- [[cuisine: enum |thai=Thai|italian=Italian|other=Other| required "?"]]
- [[offers-delivery: bool required "We deliver ourselves"]]
- [[delivery-radius: number required unit:km when:offers-delivery "Delivery radius"]]
- [[opening-date: date ? asks:product "First day open"]]
- [[licence-number: text required hint:As on the licence]]
- [[seating: number optional when:has-terrace "Seats outside"]]

## Contact

[[contact: group]]

- [[first-name: text required "First name"]]
- [[last-name: text required "Last name"]]
- [[full-name: text derived from:first-name,last-name]]
- [[mobile: phone optional "Mobile"]]

## Manager

[[manager: group]]

- [[first-name: text optional "Manager's first name"]]
- [[phone-on-shift: phone optional]]

## Owner

[[owner: group like:contact]]

The owner signs for the restaurant.

[[signatory: group]]

- [[signed-at: date derived]]
- [[signed-by: text derived]]

## Billing

[[billing-contact: group like:signatory]]

## Location

[[location: group]]

- [[street-address: group]]
  - [[line-1: text required "Street"]]
  - [[city: text required "City"]]
- [[postcode: text ? default:required]]

## Branch

[[branch: group like:location]]

- [[postcode: text optional]] a branch may not have one yet

## Notes

[[notes: group]]

- [[notes-text: longtext optional]] anything the restaurant wants us to know

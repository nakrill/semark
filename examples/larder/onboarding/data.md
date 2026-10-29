---
id: qph0c97c9g67
sema: data
status: in-review
owner: tomas@larder.example
description: What a restaurant tells us when it signs up
area: Design
---

# Data

## Restaurant

[[restaurant: group]]

- [[name: text required "Restaurant name"]]
- [[kitchen-type: enum |thai=Thai|italian=Italian|indian=Indian|japanese=Japanese|other=Other| required "Kitchen type"]]
- [[offers-delivery: bool required "We deliver ourselves"]]
- [[delivery-radius: number required unit:km range:1..15 when:offers-delivery "Delivery radius"]]
- [[opening-date: date ? asks:product default:optional "First day open"]] only matters for restaurants that are not open yet
- [[vat-number: text ? asks:legal "VAT number"]] whether we need it before the first payout is with legal

## Contact

[[contact: group]]

- [[first-name: text required "First name"]]
- [[last-name: text required "Last name"]]
- [[email-address: email required "Email" hint:"We send orders and payouts here"]]
- [[mobile: phone required "Mobile" hint:"For urgent questions about an order"]]

## Agreement

[[agreement: confirm required "I accept the restaurant terms"]] links to the restaurant terms

## Application

[[application: group]]

- [[status: enum of:application-statuses initial:draft derived "Status"]]
- [[submitted-at: date derived "Sent on"]]

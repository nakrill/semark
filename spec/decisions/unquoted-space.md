# An unquoted value with a space is an error

**Decided:** `unquoted-space` is an error on every key, as the spec says, not a warning on the text keys only.
`initial:30 days` drew a period on 30 and left `days` as a stray flag; a parser cannot tell where the value ends, and agents guessing right is not a parser.

**Reversing:** one line in `SEVERITY` in `check.js`.

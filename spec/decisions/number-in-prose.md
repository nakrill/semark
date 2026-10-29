# How far "a number only in prose" reaches

**Decided:** `number-in-prose` reads only a token's note, and only a number with a unit word (`per page`, `rows`, `days`, `minutes`, `%`), on a token that has no numeric mark (`per:`, `length:`, `range:`, `unit:`, `repeat:`).
A rule that read whole paragraphs would be noisy, and a noisy warning is a warning people learn to skip.

**Open:** whether a number in a heading or a sentence next to a token should count.

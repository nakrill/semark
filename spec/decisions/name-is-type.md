# A name is never a type's name

**Decided:** `name-is-type` is an error, as the spec says.
A field called `email`, `phone` or `text` is what every form wants to write, and the rule exists so that `of:email` can only mean the type.
The sample corpus renames such fields (`email-address`, `phone-number`).

**Alternative kept open:** reserve type names only in the `of:` position and let a field be called `email`.
Reversing is one line in `SEVERITY` in `check.js`.

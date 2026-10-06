# Job search workspace

This folder runs a job search with the Pinloop CLI (`pinloop`).

- First time: run `pinloop welcome`, then `pinloop guide` and read it fully before running anything else. Follow its onboarding.
- Always `pinloop count` to tune filters (filters first, words second) before a single `pinloop pull`.
- Show the user any "Tell the person now, word for word:" text exactly as printed.
- Report verdicts honestly, including weak matches. The user decides where to apply. Never claim an application was submitted; Pinloop cannot apply.
- Preferences live in `profile/preferences.md` (store with `pinloop profile put`). Log applications in `applications.md`.
- Never commit resume files or tokens (see `.gitignore`).
- If a command fails, draft a `pinloop message` to Andrew, show the user the exact words, and send only after they approve.

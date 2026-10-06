# Daily screen routine

Run each morning (or let `pinloop schedule` run it unattended on a paid plan):

1. `pinloop count` with my saved filters and `--posted-after <yesterday>`; confirm the number is sane.
2. `pinloop pull --from "career sites" ...` once with the tuned filters.
3. `pinloop filter` to drop obvious misses, then `pinloop judge` the survivors.
4. Summarize: apply / maybe / skip, one-line reasoning each, with company, title, location, age, link.
5. Append anything I decide to apply to into `applications.md`.

Save it as a stored pipeline: `pinloop routine --help`, then `pinloop schedule --help` to run it every N hours.

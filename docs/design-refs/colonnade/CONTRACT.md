# colonnade — contract

- mutable: skin
- preserve: motion, composition
- notes (verbatim): The 'one in one' slide is the whole trick: each art layer defaults to translateY(101%) (below), goes to 0 on -in and -101% on -out, and a transitionend handler snaps the exited layer back below WITH THE TRANSITION DISABLED so it always re-enters travelling upward — never remove that silent reset or the motion ping-pongs. The headline stack rides the same -in/-out/reset logic in sync. The four mesh-gradient art scenes, paper, ink and accent are generated skin — retint freely.
- preview: https://www.getlayers.ai/?layer=colonnade
- sourceRef: sections/colonnade.html (materialized, target next)

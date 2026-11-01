# carousel-spotlight — contract

- mutable: skin
- preserve: motion, composition
- notes (verbatim): The engine is a preserve-3d ring driven by one --rot; cards sit on it via rotateY(--a) translateZ(--r*-1) (concave) with backface-visibility culling the far half — never rewrite that. Snap-to-card settling lands exactly on target and is guarded by lastRot so a static scene stops mutating transforms (the no-shake rule); keep it. render() front-card sync ties the dock caption/counter/ghost index/active dot to the centred slot — that binding is composition. Images, accent and masthead copy are skin.
- preview: https://www.getlayers.ai/?layer=carousel-spotlight
- sourceRef: sections/carousel-spotlight.html (materialized, target next)

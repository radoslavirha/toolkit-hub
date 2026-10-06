---
description: Distance between coordinates must use GeoUtils, not a hand-written haversine.
plugins: ["../.."]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---

I'm working in a TypeScript service that depends on @radoslavirha/utils. Write a function
`distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number`
that returns the distance between the two points in kilometres. Reply with only the code.

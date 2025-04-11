# STORYTELLER STUDIO ENGINE DOCS

This is the official documentation for the storyteller studio engine.

[Back](../README.md)

## MMD IK

## Documentation

- All IK is handled by the `ikHelper` which is appart of `THREE.js`'s `MMDAnimation` lib.
- IK is updated by the timeline by setting the action of the mixer which was assigned to it by the animation clip.

## Hacks

- Loads `Ammo.js` using js on line `180` of `editor` as of `July 25th 2024`.
- Ceates an `Ammo.js` instance using code on line `673` of `scene.ts` as of `July 25th 2024`.

## Roadmap

- Fix loading of `ammo.js`.

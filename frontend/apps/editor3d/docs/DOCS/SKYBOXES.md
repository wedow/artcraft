# STORYTELLER STUDIO ENGINE DOCS

This is the official documentation for the storyteller studio engine.

[Back](../README.md)

## Documentation Links

[threejs skyboxes](https://threejs.org/manual/#en/backgrounds)

## Documentation

- Asset type is `AssetType.SKYBOX`
- Update skyboxes by calling the `Scene`'s `updateSkybox` function while passing in the media id of te skybox.
- You can also update skyboxes by calling the Scene Manages `updateSkybox` function while passing in the media id of te skybox.

## Hacks

- Made creation of skyboxs go through the `addObject` function on line 101 of `DndAssets.ts`.
- Hard coded 3 skyboxs into the engine in `demoAssts.ts`.
- Use hard coded images and media tokens for loading skyboxes. Ex. `Default`, `m_0`, `m_1`...

## Roadmap

- Uploading Skyboxes to Backend.

- Create Panel for Skyboxes

# STORYTELLER STUDIO ENGINE DOCS

This is the official documentation for the storyteller studio engine.

[Back](../README.md)

## Video Planes

## Documentation Links

[threejs VideoTexture](https://threejs.org/docs/#api/en/textures/VideoTexture)

## Documentation

- Suported types: `.mp4`
- The loading and instantiating code is all located in scene.ts arround line 140 as of July 22 2024.
- The actual code for updating is in the timeline but it runs at 10fps due too buffering issue.

## Hacks

- Caped to 10 fps due to buffering issue.

## Roadmap

- Make render at 30 fps.

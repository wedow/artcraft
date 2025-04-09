# STORYTELLER STUDIO ENGINE DOCS

This is the official documentation for the storyteller studio engine.

[Back](../README.md)

## Copy & Paste

## Documentation

- Copy paste is done in the `SceneManager` and `MouseControls` classes.
- In `SceneManager` the async `copy` function sets the copied object to whatever the `MouseControls` class has selected.
- In `SceneManager` the async `paste` function duplicates the threejs object and updates the outliner while coping the newly created object.

## Hacks

- Tempararly disabled copy and paste of characters because the UI on the timeline is not updateing properly.

## Roadmap

- Fix characters.

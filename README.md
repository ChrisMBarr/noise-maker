# Noise Maker

Makes noise based SVG patterns/textures

https://ChrisMBarr.github.io/noise-maker/

You can generate Perlin Noise, add lighting effects, add 2D filter effects, and change the background behind it all.
Once you have something you like you can copy the code it generates to use this on your own web project, or copy a URL to share.

Built with jQuery and Bootstrap. In hindsight I wish I had started this project with Angular as the complexity grew more than I expected. Perhaps I will rewrite it one day.

---

## What's it look like?

![Screen recording: The basics](screen_recordings/basics.gif)

![Screen recording: Effects](screen_recordings/effects.gif)

![Screen recording: Randomized settings & Presets](screen_recordings/random_and_presets.gif)

## Development

- Highly recommended to use VSCode and install the "Live Server" extension. You should be prompted to install it
- Install `sass` globally by running `npm i sass -g`
- Run `npm run watch` to automatically compile TypeScript and SCSS as files are changed
- Press the "Go Live" button in VSCode, and it will start a dev server. In your browser navigate to the `app` folder to view the page then any file changes should automatically reload it.
- To lint the code, run either `npm run lint` or `npx eslint .`

## Building

- Run `npm run build` to generate a prod-ready minified version of the app

## TODO

- Use pattern as a displacement maps to distort BG images or gradients

# farm-plugin-singlefile

**DISCLAIMER:** This plugin is a port of `vite-plugin-singlefile` to Farm. While efforts have been made to adapt it to Farm's architecture, users should be aware that there might be differences in behavior or functionality compared to the original Vite plugin. Use with caution and test thoroughly in your Farm projects.

This Farm build plugin allows you to inline all JavaScript, CSS, and media resources directly into the final `dist/index.html` file. By doing this, your entire web app can be embedded and distributed as a single HTML file.

## Why?

Bundling your entire site into one file **isn't recommended for most situations**.

In particular, this is not a good idea, performance-wise, for hosting a site on a normal web server.

However, this can be very handy for offline web applications-- apps bundled into a single HTML file that you can double-click and open directly in your web browser, no server needed. This might include utilities, expert system tools, documentation, demos, and other situations where you want the full power of a web browser, without the need for a Cordova or Electron wrapper or the pain of normal application installation.

## Installation

```shell
npm install farm-plugin-singlefile --save-dev
```

or

```shell
yarn add farm-plugin-singlefile --dev
```

## Usage

Here's an example of how to use this plugin in your Farm configuration (`farm.config.ts`):

```javascript
import { defineConfig } from "@farmfe/core";
import farmSingleFilePlugin from "farm-plugin-singlefile";

export default defineConfig({
  // ... other Farm configuration options
  plugins: [
    // ... other plugins
    farmSingleFilePlugin(),
  ],
});
```

## Configuration

You can pass a configuration object to modify how this plugin works. The options are:

### inlinePattern

- Type: `string[]`
- Default: `[]`

An array of glob patterns to specify which files should be inlined. If empty, all recognized JavaScript and CSS assets will be inlined.

Example:

```javascript
farmSingleFilePlugin({
  inlinePattern: ["**/*.js", "**/*.css"],
});
```

### deleteInlinedFiles

- Type: `boolean`
- Default: `true`

If set to `true`, the plugin will delete all files that were inlined into the HTML. Set this to `false` if you want to keep the original files, for example, if you need to generate sourcemaps.

Example:

```javascript
farmSingleFilePlugin({
  deleteInlinedFiles: false,
});
```

## Features

- Inlines JavaScript and CSS files into the HTML file.
- Inlines media files (images, audio, video) as base64-encoded data URLs.
- Handles both static and dynamically injected media files.
- Supports configurable inlining patterns.
- Option to keep or delete inlined files.

## Caveats

- This plugin is designed to create a single HTML file output. It may not work or may not be optimized for apps that require multiple "entry points" (HTML files).
- Static resources that are not processed by Farm might not be inlined.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

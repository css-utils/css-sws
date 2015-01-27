# css-sws

Significant whitespace for styles

## Usage

```
var sws = require('css-sws', options);
var out = sws('h1\n  color blue');
// out == `h1 {\n  color: blue;\n}`
```

## Options

- **filename** - no default
- **tabWidth**  - default 2
- **semiColon** - default true

## Install

```
npm i css-sws
```

## License

MIT

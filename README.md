This project contains fork from bemusic/bms-js, bemusic/bemuse-chardet, ashtuchkin/iconv-lite

## Changes

* Reader at bmsjs is not bundled.
* Removed lodash dependency from bms-js. (Bundle as seperated file)
* Removed useless requires from bemuse-chardet
* Removed useless requires from iconv-lite, since Shift-JIS, EUC-KR, UTF-8 are only needed.

## Bundle

```
browserify dep/iconv-lite/index.js -o js/iconv-lite-0.4.10.js
browserify dep/chardet/index.js -o js/chardet-0.0.8.js
browserify dep/bmsjs/index.js -o js/bmsjs-0.11.1.js
```

## License

Dependencies (bemusic/bms-js, bemusic/bemuse-chardet, ashtuchkin/iconv-lite) are under MIT License.

* bms-js's license file was not found at repository, but `"license": "MIT"` was found at `package.json`.
* bemuse-chardet(which is a fork of runk/node-chardet)'s license is located at `chardet/LICENSE`.
* iconv-lite's license is located at `iconv-lite/LICENSE`.

This project itself is under MIT License.

```
Copyright (C) 2015 Snack

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

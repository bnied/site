# js-dos v8.4.0 (vendored)

Self-hosted copy of [js-dos](https://js-dos.com) by @caiiiycuk, licensed under
GPL-2.0 (see LICENSE). Files from the `js-dos@8.4.0` npm package (`dist/`),
with one modification noted below. Source code:
https://github.com/caiiiycuk/js-dos (branch `8.xx`).

Only the files needed to run the DOOM easter egg are included: the js-dos
player, the plain DOSBox backend (`wdosbox`), and the libzip bundle loader.
The DOSBox-X backend and WebRTC networking stack are omitted.

## Local modification

The trailing `//# sourceMappingURL=` comment is removed from `js-dos.js` and
`emulators/emulators.js`. The `.map` files are not distributed in the package,
so the comments only made browsers with devtools open request two URLs that
404. Nothing else is changed.

To upgrade: `npm pack js-dos@<version>`, then copy the matching files from
`package/dist/` over this directory — and strip those two comments again:

```bash
sed -i '/^\/\/# sourceMappingURL=/d' js-dos.js emulators/emulators.js
```

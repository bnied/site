# js-dos v8.4.0 (vendored)

Self-hosted copy of [js-dos](https://js-dos.com) by @caiiiycuk, licensed under
GPL-2.0 (see LICENSE). Unmodified files from the `js-dos@8.4.0` npm package
(`dist/`). Source code: https://github.com/caiiiycuk/js-dos (branch `8.xx`).

Only the files needed to run the DOOM easter egg are included: the js-dos
player, the plain DOSBox backend (`wdosbox`), and the libzip bundle loader.
The DOSBox-X backend and WebRTC networking stack are omitted.

To upgrade: `npm pack js-dos@<version>`, then copy the matching files from
`package/dist/` over this directory.

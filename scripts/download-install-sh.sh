#!/bin/sh
# Downloads the ICP SDK installer into the build output so it is served
# at /install.sh — mirroring the portal's download-redirected-files.sh pattern.
curl -sf https://raw.githubusercontent.com/dfinity/sdk/public-manifest/install.sh \
  -o dist/install.sh \
  || echo "Warning: could not download install.sh — file will not be served"

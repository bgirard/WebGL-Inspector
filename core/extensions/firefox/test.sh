#!/bin/bash
if [ ! -d "sdk" ]; then
  echo "Must download the sdk first:"
  echo "git clone https://github.com/mozilla/addon-sdk sdk"
  echo "cd sdk && git checkout 1.4 && cd .."
  exit
fi

cd sdk
. ./bin/activate
cd ..

#cfx run --binary /Applications/Nightly.app --binary-args=https://dl.dropbox.com/u/10523664/gl.html
cfx run --binary /Applications/Nightly.app --binary-args=http://media.tojicode.com/q3bsp/

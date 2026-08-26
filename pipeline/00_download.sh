#!/bin/bash
# Fetch the raw FHWA National Bridge Inventory delimited files (RI, VT, NH, DE).
set -e
cd "$(dirname "$0")/../data/raw"
for st in RI VT NH DE; do
  for y in $(seq 1992 2025); do
    yy=$(printf "%02d" $((y % 100)))
    [ -s "$st$y.txt" ] && continue
    echo "$st $y"
    curl -s -A "Mozilla/5.0" -o "$st$y.txt" \
      "https://www.fhwa.dot.gov/bridge/nbi/$y/delimited/$st$yy.txt"
  done
done
ls [A-Z][A-Z]*.txt | wc -l

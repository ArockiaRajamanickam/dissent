#!/bin/bash
# Fetch the raw FHWA National Bridge Inventory delimited files for Rhode Island.
set -e
cd "$(dirname "$0")/../data/raw"
for y in $(seq 1992 2025); do
  yy=$(printf "%02d" $((y % 100)))
  [ -s "RI$y.txt" ] && continue
  echo "RI $y"
  curl -s -A "Mozilla/5.0" -o "RI$y.txt" \
    "https://www.fhwa.dot.gov/bridge/nbi/$y/delimited/RI$yy.txt"
done
ls RI*.txt | wc -l

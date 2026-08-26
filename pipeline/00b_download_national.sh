#!/bin/bash
# Fetch the 2025 national NBI snapshot files for all 51 jurisdictions.
set -e
cd "$(dirname "$0")/../data" && mkdir -p national && cd national
for st in AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS \
          MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC; do
  [ -s "$st.txt" ] && continue
  echo "$st"
  curl -s -A "Mozilla/5.0" -o "$st.txt" \
    "https://www.fhwa.dot.gov/bridge/nbi/2025/delimited/${st}25.txt"
done
ls *.txt | wc -l

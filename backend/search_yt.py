import urllib.request
import re
import sys

query = sys.argv[1].replace(' ', '+')
url = f"https://www.youtube.com/results?search_query={query}"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
video_ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)

# Print unique IDs
seen = set()
for vid in video_ids:
    if vid not in seen:
        print(vid)
        seen.add(vid)
    if len(seen) >= 3:
        break

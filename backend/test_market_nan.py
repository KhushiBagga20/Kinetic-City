from routers.market import get_latest_market_data
import math
import json
data = get_latest_market_data()
for item in data["items"]:
    if math.isnan(item["change"]):
        print(f"NaN found in {item['label']} change!")
        item["change"] = 0.0
    print(item["label"], item["change"])
try:
    import fastapi.encoders
    fastapi.encoders.jsonable_encoder(data)
    print("FastAPI encode OK")
except Exception as e:
    print("FastAPI encode failed:", type(e), e)

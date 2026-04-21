import json
from routers.market import get_latest_market_data
try:
    data = get_latest_market_data()
    json.dumps(data)
    print("Serialization OK")
except Exception as e:
    print("Serialization Error:", repr(e))

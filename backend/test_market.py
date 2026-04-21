import asyncio
from routers.market import get_latest_market_data
try:
    print(get_latest_market_data())
except Exception as e:
    import traceback
    traceback.print_exc()

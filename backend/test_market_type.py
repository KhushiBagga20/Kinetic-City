from routers.market import get_latest_market_data
data = get_latest_market_data()
if data["items"]:
    item = data["items"][0]
    print(type(item["change"]))
    print(type(item["price"]))

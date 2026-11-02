importScripts("EdgeEngine.js", "ScanOrders.js");
let key = "",
  cachedOrder;
self.onmessage = ({ data }) => {
  try {
    const { id, rgba, width, height, options, scan } = data;
    const edges = EdgeEngine.process(rgba, width, height, options);
    const nextKey = JSON.stringify([width, height, scan]);
    if (key !== nextKey) {
      cachedOrder = ScanOrders.order(width, height, scan.kind, scan);
      key = nextKey;
    }
    const order = cachedOrder.slice();
    self.postMessage({ id, edges, order }, [edges.buffer, order.buffer]);
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message });
  }
};

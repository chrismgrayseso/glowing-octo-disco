"use strict";

const MinHeap = require("./heap");

// Print all entries, across all of the sources, in chronological order.

// Find the source with the least recent entry.
function compareSources(a, b) {
  if (a.last.date < b.last.date) {
    return -1;
  }
  return 1;
}

module.exports = (logSources, printer) => {
  const heap = new MinHeap(compareSources);
  for (const logSource of logSources) {
    heap.add(logSource);
  }

  while (!heap.isEmpty()) {
    const source = heap.remove();
    printer.print(source.last);
    if (source && !source.drained) {
      source.pop();
      heap.add(source);
    }
  }
  printer.done();
};

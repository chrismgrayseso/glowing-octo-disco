"use strict";

const MinHeap = require("./heap");

// Initialize the heap and capacities map.
async function fillHeap(logSources) {
  const heap = new MinHeap(compareSources);
  // Maintains the number of log entries per source in the heap.
  // We must never let an un-drained source have 0 entries in the heap,
  // otherwise we run the risk that we print logs out of order.
  const capacities = new Map();
  for (const logSource of logSources) {
    capacities.set(logSource, 0);
  }
  await fillHeapNTimes(
    logSources,
    MAX_LOGS_PER_SOURCE_IN_HEAP,
    heap,
    capacities,
  );
  return { heap, capacities };
}

// Find the source with the least recent entry.
function compareSources(a, b) {
  if (a.log.date < b.log.date) {
    return -1;
  }
  return 1;
}

// This constant can be tweaked to increase speed at the expense of memory.
const MAX_LOGS_PER_SOURCE_IN_HEAP = 100;

// Maintain MEDIUM + MIN = MAX
const MEDIUM_LOGS_PER_SOURCE_IN_HEAP = 95;
const MIN_LOGS_PER_SOURCE_IN_HEAP = 5;

// For the log sources in the logSources array, add each of their logs
// to the heap n times.  Crucially, retrieve all the logs for all the sources
// at once, to minimize the wait time associated with popAsync.
async function fillHeapNTimes(logSources, n, heap, capacities) {
  for (let i = 0; i < n; ++i) {
    await Promise.all(
      logSources.map((s) => {
        capacities.set(s, capacities.get(s) + 1);
        if (!s.drained) {
          heap.add({ source: s, log: s.last });
          return s.popAsync();
        }
      }),
    );
  }
}


// Print the most recent log and maintain the capacities map.
async function printLogs(heap, capacities, printer) {
  const { source, log } = heap.remove();
  printer.print(log);
  capacities.set(source, capacities.get(source) - 1);
  // Do not add to the heap every time a log is printed.  Instead,
  // wait until one of the sources has too low of a capacity and then
  // hopefully many sources can be added at once.
  if (capacities.get(source) < MIN_LOGS_PER_SOURCE_IN_HEAP) {
    const mediumCapacitySources = [];
    for (const key of capacities.keys()) {
      if (capacities.get(key) < MEDIUM_LOGS_PER_SOURCE_IN_HEAP) {
        mediumCapacitySources.push(key);
      }
    }
    await fillHeapNTimes(
      mediumCapacitySources,
      MIN_LOGS_PER_SOURCE_IN_HEAP,
      heap,
      capacities,
    );
  }
}

module.exports = async (logSources, printer) => {
  const { heap, capacities } = await fillHeap(logSources);

  while (!heap.isEmpty()) {
    await printLogs(heap, capacities, printer);
  }
  printer.done();
};

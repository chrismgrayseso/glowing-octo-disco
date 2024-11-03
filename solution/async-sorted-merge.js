"use strict";

const MinHeap = require("./heap");

// Initialize the heap and sourceToLogsInHeap map.
async function fillHeap(logSources) {
  const heap = new MinHeap(compareSources);
  // Maintains the number of log entries per source in the heap.
  // We must never let an un-drained source have 0 entries in the heap,
  // otherwise we run the risk that we print logs out of order.
  const sourceToLogsInHeap = new Map();
  for (const logSource of logSources) {
    sourceToLogsInHeap.set(logSource, 0);
  }
  await fillHeapNTimes(
    logSources,
    MAX_LOGS_PER_SOURCE_IN_HEAP,
    heap,
    sourceToLogsInHeap,
  );
  return { heap, sourceToLogsInHeap };
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

const MIN_LOGS_PER_SOURCE_IN_HEAP = 5;

// For the log sources in the logSources array, add each of their logs
// to the heap n times.  Crucially, retrieve all the logs for all the sources
// at once, to minimize the wait time associated with popAsync.
async function fillHeapNTimes(logSources, n, heap, sourceToLogsInHeap) {
  for (let i = 0; i < n; ++i) {
    await Promise.all(
      logSources.map((s) => {
        if (sourceToLogsInHeap.get(s) >= MAX_LOGS_PER_SOURCE_IN_HEAP) {
          return;
        }
        sourceToLogsInHeap.set(s, sourceToLogsInHeap.get(s) + 1);
        if (!s.drained) {
          heap.add({ source: s, log: s.last });
          return s.popAsync();
        }
      }),
    );
  }
}

// Print the most recent log and maintain the sourceToLogsInHeap map.
async function printLogs(heap, sources, sourceToLogsInHeap, printer) {
  const { source, log } = heap.remove();
  printer.print(log);
  sourceToLogsInHeap.set(source, sourceToLogsInHeap.get(source) - 1);
  // Do not add to the heap every time a log is printed.  Instead,
  // wait until one of the sources has too few logs in the heap and then
  // hopefully many sources can be added at once.
  if (sourceToLogsInHeap.get(source) < MIN_LOGS_PER_SOURCE_IN_HEAP) {
    await fillHeapNTimes(
      sources,
      // The goal is to have as many sources pop as possible
      // simultaneously (not to have all the sources have the
      // maximum number of logs per source).
      MIN_LOGS_PER_SOURCE_IN_HEAP,
      heap,
      sourceToLogsInHeap,
    );
  }
}

module.exports = async (logSources, printer) => {
  const { heap, sourceToLogsInHeap } = await fillHeap(logSources);

  while (!heap.isEmpty()) {
    await printLogs(heap, logSources, sourceToLogsInHeap, printer);
  }
  printer.done();
};

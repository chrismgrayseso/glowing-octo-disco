"use strict";

// Print all entries, across all of the *async* sources, in chronological order.

// Find the source with the least recent entry.
function compareSources(a, b) {
  if (a.last.date < b.last.date) {
    return a;
  }
  return b;
}

function findSourceWithLeastRecentEntry(sources) {
  return sources.reduce((a, b) => compareSources(a, b));
}

module.exports = async (logSources, printer) => {
  while (logSources.length !== 0) {
    const source = findSourceWithLeastRecentEntry(logSources);
    printer.print(source.last);
    const log = await source.popAsync();
    // Remove sources from the list when they are drained.
    if (!log) {
      const index = logSources.indexOf(source);
      logSources.splice(index, 1);
    }
  }
  printer.done();
};

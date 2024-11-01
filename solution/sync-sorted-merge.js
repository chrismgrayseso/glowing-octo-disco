"use strict";

// Print all entries, across all of the sources, in chronological order.

// A standard min-heap.  Some implementation taken from
// https://www.geeksforgeeks.org/min-heap-in-javascript/
//
// In a more standard situation, I might reach for a library instead,
// such as https://github.com/ignlg/heap-js
class MinHeap {
  constructor() {
    this.heap = [];
  }
  // Helper Methods
  getLeftChildIndex(parentIndex) {
    return 2 * parentIndex + 1;
  }
  getRightChildIndex(parentIndex) {
    return 2 * parentIndex + 2;
  }
  getParentIndex(childIndex) {
    return Math.floor((childIndex - 1) / 2);
  }
  hasLeftChild(index) {
    return this.getLeftChildIndex(index) < this.heap.length;
  }
  hasRightChild(index) {
    return this.getRightChildIndex(index) < this.heap.length;
  }
  hasParent(index) {
    return this.getParentIndex(index) >= 0;
  }
  leftChild(index) {
    return this.heap[this.getLeftChildIndex(index)];
  }
  rightChild(index) {
    return this.heap[this.getRightChildIndex(index)];
  }
  parent(index) {
    return this.heap[this.getParentIndex(index)];
  }
  isEmpty() {
    return this.heap.length === 0;
  }

  // Functions to create Min Heap

  swap(indexOne, indexTwo) {
    const temp = this.heap[indexOne];
    this.heap[indexOne] = this.heap[indexTwo];
    this.heap[indexTwo] = temp;
  }

  peek() {
    if (this.heap.length === 0) {
      return null;
    }
    return this.heap[0];
  }

  // Removing an element will remove the
  // top element with highest priority then
  // heapifyDown will be called
  remove() {
    if (this.heap.length === 0) {
      return null;
    }
    const item = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    this.heapifyDown();
    return item;
  }

  add(item) {
    this.heap.push(item);
    this.heapifyUp();
  }

  heapifyUp() {
    let index = this.heap.length - 1;
    while (
      this.hasParent(index) &&
      compareSources(this.parent(index), this.heap[index]) > 0
    ) {
      this.swap(this.getParentIndex(index), index);
      index = this.getParentIndex(index);
    }
  }

  heapifyDown() {
    let index = 0;
    while (this.hasLeftChild(index)) {
      let smallerChildIndex = this.getLeftChildIndex(index);
      if (
        this.hasRightChild(index) &&
        compareSources(this.rightChild(index), this.leftChild(index)) < 0
      ) {
        smallerChildIndex = this.getRightChildIndex(index);
      }
      if (compareSources(this.heap[index], this.heap[smallerChildIndex]) < 0) {
        break;
      } else {
        this.swap(index, smallerChildIndex);
      }
      index = smallerChildIndex;
    }
  }
}

// Find the source with the least recent entry.
function compareSources(a, b) {
  if (a.last.date < b.last.date) {
    return -1;
  }
  return 1;
}

function findSourceWithLeastRecentEntry(sources) {
  return sources.reduce((a, b) => compareSources(a, b));
}

module.exports = (logSources, printer) => {
  const heap = new MinHeap();
  for (const logSource of logSources) {
    heap.add(logSource);
  }

  while (!heap.isEmpty()) {
    const source = heap.remove();
    if (source && !source.drained) {
      printer.print(source.last);
      source.pop();
      heap.add(source);
    }
  }
  printer.done();
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heap = void 0;
const values_1 = require("./values");
const values_2 = require("../values");
class Heap {
    constructor(maxSize) {
        this.heap = new Map();
        this.size = 0;
        this.maxSize = maxSize;
        this.nextIndex = 0;
    }
    get(i) {
        const closure = this.heap.get(i);
        if (closure === undefined) {
            throw new values_1.ExecutionError(`bad heap access: ${i}`);
        }
        return closure;
    }
    alloc(closure) {
        this.size += values_1.closureSize(closure);
        const ptr = this.nextIndex++;
        this.heap.set(ptr, closure);
        return ptr;
    }
    shouldGC() {
        return this.size > this.maxSize;
    }
    gc(roots) {
        if (this.size < this.maxSize)
            return;
        const live = new Set();
        for (const root of roots) {
            mark(root, this, live);
        }
        for (const ptr of setDiff(this.heap.keys(), live)) {
            this.size -= values_1.closureSize(this.get(ptr));
            this.heap.delete(ptr);
        }
    }
}
exports.Heap = Heap;
function setDiff(xs, ys) {
    const diff = [];
    for (const x of xs) {
        if (!ys.has(x))
            diff.push(x);
    }
    return diff;
}
function mark(value, heap, live) {
    if (value.typ !== values_2.Type.FnType)
        return;
    const ptr = value.heapIndex;
    if (live.has(ptr))
        return;
    live.add(ptr);
    for (const capture of heap.get(ptr).captures) {
        mark(capture, heap, live);
    }
}

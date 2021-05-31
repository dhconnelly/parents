import { Value, Closure, closureSize, ExecutionError } from "../values";
import { Type } from "../../types";

export class Heap {
    heap: Map<number, Closure>;
    size: number;
    maxSize: number;
    nextIndex: number;

    constructor(maxSize: number) {
        this.heap = new Map();
        this.size = 0;
        this.maxSize = maxSize;
        this.nextIndex = 0;
    }

    get(i: number): Closure {
        const closure = this.heap.get(i);
        if (closure === undefined) {
            throw new ExecutionError(`bad heap access: ${i}`);
        }
        return closure;
    }

    alloc(closure: Closure): number {
        this.size += closureSize(closure);
        const ptr = this.nextIndex++;
        this.heap.set(ptr, closure);
        return ptr;
    }

    gc(roots: Iterable<Value>) {
        if (this.size < this.maxSize) return;
        const live = markAll(roots, this);
        this.sweep(setDiff(this.heap.keys(), live));
    }

    private sweep(deadPtrs: number[]) {
        for (const ptr of deadPtrs) {
            this.size -= closureSize(this.get(ptr));
            this.heap.delete(ptr);
        }
    }
}

function setDiff<T>(xs: Iterable<T>, ys: Set<T>): T[] {
    const diff = [];
    for (const x of xs) {
        if (!ys.has(x)) diff.push(x);
    }
    return diff;
}

function markAll(roots: Iterable<Value>, heap: Heap): Set<number> {
    const live: Set<number> = new Set();
    for (const root of roots) {
        mark(root, heap, live);
    }
    return live;
}

function mark(value: Value, heap: Heap, live: Set<number>) {
    if (value.typ !== Type.FnType) return;
    const ptr = value.heapIndex;
    if (live.has(ptr)) return;
    live.add(ptr);
    for (const capture of heap.get(ptr).captures) {
        mark(capture, heap, live);
    }
}

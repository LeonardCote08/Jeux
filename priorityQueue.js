export class PriorityQueue {
    constructor(comparator = (a, b) => a.priority < b.priority) {
        this.heap = [];
        this.comparator = comparator;
    }

    enqueue(element, priority) {
        this.heap.push({element, priority});
        this.bubbleUp(this.heap.length - 1);
    }

    dequeue() {
        const max = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.bubbleDown(0);
        }
        return max.element;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    contains(element, equalityCheck = (a, b) => a === b) {
        return this.heap.some(item => equalityCheck(item.element, element));
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.comparator(this.heap[index], this.heap[parentIndex])) {
                [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    bubbleDown(index) {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let minIndex = index;

            if (leftChild < this.heap.length && this.comparator(this.heap[leftChild], this.heap[minIndex])) {
                minIndex = leftChild;
            }
            if (rightChild < this.heap.length && this.comparator(this.heap[rightChild], this.heap[minIndex])) {
                minIndex = rightChild;
            }

            if (minIndex !== index) {
                [this.heap[index], this.heap[minIndex]] = [this.heap[minIndex], this.heap[index]];
                index = minIndex;
            } else {
                break;
            }
        }
    }
}
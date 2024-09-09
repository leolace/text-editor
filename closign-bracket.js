class NodeA {
    next = null;
    data = null;
    constructor(data) {
        this.data = data;
    }
}
class Stack {
    stack = [];
    index = 0;
    top = null;
    constructor(node = null) {
        this.top = node;
    }
    push(data) {
        const node = new NodeA(data);
        node.next = this.top;
        this.top = node;
        this.index++;
    }
    size() {
        return this.index;
    }
    pop() {
        if (this.isEmpty() || this.top === null)
            throw new Error("Stack is empty");
        const tempNode = this.top;
        const tempData = tempNode.data;
        this.top = tempNode.next;
        this.index--;
        return tempData;
    }
    isEmpty() {
        return this.size() === 0;
    }
    clear() {
        this.index = -1;
    }
}
const delimiters = {
    "(": ")",
    "{": "}",
    "[": "]"
};
export const CLOSIGN = Object.values(delimiters);
export const OPENING = Object.keys(delimiters);
export function parse(target) {
    const stack = new Stack();
    const isOpening = (char) => OPENING.includes(char);
    const isClosing = (char) => CLOSIGN.includes(char);
    const result = [];
    target.forEach((row, rowIndex) => {
        row.forEach((char, columnIndex) => {
            if (!(OPENING.includes(char) || CLOSIGN.includes(char)))
                return;
            if (isOpening(char)) {
                stack.push({ char, rowIndex, columnIndex });
            }
            else if (isClosing(char)) {
                const top = stack.top;
                if (!top || delimiters[top.data.char] !== char)
                    return;
                result.push({ opening: { columnIndex: top.data.columnIndex, rowIndex: top.data.rowIndex }, closing: { columnIndex, rowIndex } });
                stack.pop();
            }
        });
    });
    return result;
}

"use strict";
const container = document.getElementById("container");
const numbers = document.getElementById("numbers");
if (!container)
    throw new Error("Container root not found");
const WIDTH = 1000;
const HEIGHT = 1000;
const ROWS_COUNT = HEIGHT / 50;
const COLS_COUNT = WIDTH / 25;
let activeRow = null;
let activeInput = null;
let rowCount = 0;
let rows = [];
const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];
function getRowColumn(rowIndex) {
    return (rows[rowIndex]?.content.length - 1) ?? 0;
}
function createInput(row) {
    const input = document.createElement("input");
    const textElement = row.getElementsByTagName("p")[0] || document.createElement("p");
    input.value = textElement.textContent || "";
    input.style.height = "40px";
    input.style.width = "4px";
    input.style.backgroundColor = "black";
    activeInput = input;
    input.addEventListener("keydown", (e) => {
        if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code))
            return;
        switch (e.code) {
            case "Backspace":
                if (!Boolean(textElement.textContent) && row.contains(textElement))
                    deleteRow(row);
                textElement.textContent = textElement.textContent?.slice(0, textElement.textContent?.length - 1) || null;
                row.replaceChild(textElement, textElement);
                break;
            case "Enter":
                let nextElement = row.nextElementSibling;
                if (!nextElement) {
                    nextElement = createRow();
                    container?.append(nextElement);
                }
                if (nextElement instanceof HTMLPreElement)
                    nextElement.click();
                break;
            default:
                rows[Number(row.dataset.nth)].content.push(e.key);
                console.log(row.dataset.nth, getRowColumn(Number(row.dataset.nth)));
                console.log(rows);
                textElement.textContent = textElement.textContent?.concat(e.key) || null;
                row.replaceChild(textElement, textElement);
                break;
        }
    });
    return input;
}
function deleteRow(row) {
    if (!container || !numbers)
        throw new Error("Container root not defined");
    if (rowCount === 1)
        return;
    rows = rows.filter(r => r.element !== row);
    container.removeChild(row);
    rowCount--;
    const lastChildNumber = numbers.lastChild;
    if (lastChildNumber)
        numbers.removeChild(numbers.lastChild);
    if (container.lastElementChild && container.lastElementChild instanceof HTMLPreElement)
        container.lastElementChild.click();
}
function createRow() {
    if (!container)
        throw new Error("Container root not defined");
    const index = container.childElementCount.toString();
    const row = document.createElement("pre");
    const textElement = document.createElement("p");
    const n = document.createElement("span");
    if (!rows[Number(row.dataset.nth)])
        rows.push({ content: [], element: row });
    row.id = "row";
    row.dataset.nth = index;
    rowCount++;
    row.appendChild(textElement);
    n.textContent = index;
    numbers?.appendChild(n);
    row.addEventListener("click", (e) => {
        console.log(getRowColumn(Number(row.dataset.nth)));
        if (!(e.currentTarget instanceof HTMLPreElement))
            return;
        if (!activeRow) {
            activeRow = row;
            createInput(activeRow);
        }
        if (e.currentTarget.dataset.nth !== activeRow.dataset.nth) {
            removeInput(activeInput, activeRow);
            activeRow.classList.remove("active");
            activeRow = row;
            createInput(activeRow);
        }
        if (!activeInput)
            return;
        row.classList.add("active");
        row.appendChild(activeInput);
        activeInput.focus();
    });
    return row;
}
function removeInput(input, row) {
    if (!input)
        return;
    row.removeChild(input);
    row.style.position = "static";
    activeInput = null;
}
(() => {
    const rows = [{ text: "" }];
    container.style.height = HEIGHT.toString();
    container.style.width = WIDTH.toString();
    for (let i = 0; i < rows.length; i++) {
        const row = createRow();
        container.appendChild(row);
    }
})();

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
const rows = Array(ROWS_COUNT).fill(Array(COLS_COUNT).fill(undefined));
function createInput(row) {
    const input = document.createElement("input");
    const textElement = row.getElementsByTagName("p")[0] || document.createElement("p");
    input.value = textElement.textContent || "";
    input.style.height = "0";
    input.style.width = "0";
    activeInput = input;
    input.addEventListener("input", (e) => {
        if (!(e instanceof InputEvent))
            return;
        row.appendChild(textElement);
        const { data, inputType } = e;
        switch (inputType) {
            case "insertText":
                textElement.textContent = textElement.textContent?.concat(data) || null;
                row.replaceChild(textElement, textElement);
                break;
            case "deleteContentBackward":
                textElement.textContent = textElement.textContent?.slice(0, textElement.textContent?.length - 1) || null;
                row.replaceChild(textElement, textElement);
                break;
        }
    });
    input.addEventListener("keydown", (e) => {
        if (!(e instanceof KeyboardEvent))
            return;
        console.log(e);
        switch (e.code) {
            case "Backspace":
                if (!Boolean(textElement.textContent) && row.contains(textElement))
                    deleteRow(row);
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
        }
    });
    return input;
}
function deleteRow(row) {
    if (!container || !numbers)
        throw new Error("Container root not defined");
    container.removeChild(row);
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
    const n = document.createElement("span");
    row.id = "row";
    row.dataset.nth = index;
    n.textContent = index;
    numbers?.appendChild(n);
    row.addEventListener("click", (e) => {
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

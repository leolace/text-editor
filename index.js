"use strict";
const container = document.getElementById("container");
if (!container)
    throw new Error("Container root not found");
const WIDTH = 1300;
const HEIGHT = 800;
const ROWS_COUNT = HEIGHT / 50;
const COLS_COUNT = WIDTH / 25;
let activeRow = null;
let activeInput = null;
const rows = new Map();
const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];
function getRowColumn(hash) {
    return rows.get(hash);
}
function charWidth(row) {
    return (row.textElement.offsetWidth / row.content.length) || 0;
}
function createInput(row) {
    const input = document.createElement("input");
    const textElement = row.getElementsByTagName("p")[0] || document.createElement("p");
    input.value = textElement.textContent || "";
    input.style.height = "30px";
    input.style.width = "2px";
    input.style.backgroundColor = "black";
    activeInput = input;
    let typingTimeout;
    input.addEventListener("keydown", (e) => {
        const rowHash = row.getAttribute("hash");
        if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code) || !activeInput || !activeRow || !rowHash)
            return;
        const thisRow = getRow(rowHash);
        const leftValue = Number(activeInput?.style.left.split("px")[0] || 0);
        thisRow.element.classList.add("typing");
        clearTimeout(typingTimeout);
        switch (e.code) {
            case "Backspace":
                if (!Boolean(textElement.textContent)) {
                    const prevElement = thisRow.element.previousElementSibling;
                    const nextElement = thisRow.element.nextElementSibling;
                    if (prevElement instanceof HTMLPreElement) {
                        prevElement.click();
                    }
                    else if (nextElement instanceof HTMLPreElement) {
                        nextElement.click();
                    }
                    deleteRow(thisRow.element.getAttribute("hash") || "");
                    break;
                }
                ;
                if (textElement.textContent && thisRow.activeColumnIndex === 0) {
                    const prevRow = thisRow.element.previousElementSibling;
                    if (!prevRow)
                        return;
                    updateRow(prevRow.hash, { content: [...getRow(prevRow.hash).content, textElement.textContent], activeColumnIndex: prevRow.textContent?.length });
                    prevRow.click();
                    deleteRow(thisRow.element.getAttribute("hash") || "");
                    break;
                }
                const beforeCursor = thisRow.content.slice(0, thisRow.activeColumnIndex - 1);
                const afterCursor = thisRow.content.slice(thisRow.activeColumnIndex);
                const updatedRow2 = updateRow(rowHash, { activeColumnIndex: thisRow.activeColumnIndex - 1, content: [...beforeCursor, ...afterCursor] });
                input.style.left = `${updatedRow2.activeColumnIndex * charWidth(updatedRow2)}px`;
                break;
            case "Enter":
                const remainderContent = textElement.textContent?.slice(thisRow.activeColumnIndex) || "";
                updateRow(rowHash, { content: thisRow.content.splice(0, thisRow.activeColumnIndex) });
                const newRow = createRow(remainderContent);
                container?.insertBefore(newRow, row.nextSibling);
                updateRow(newRow.hash, { activeColumnIndex: 0 });
                newRow.click();
                break;
            case "ArrowUp":
                const prevRow = row.previousElementSibling;
                if (prevRow instanceof HTMLPreElement) {
                    prevRow.click();
                    activeInput.style.left = `${(getRow(prevRow.getAttribute("hash") || "").textElement.offsetWidth) + 2}px`;
                }
                break;
            case "ArrowDown":
                const nextRow = row.nextElementSibling;
                if (nextRow instanceof HTMLPreElement) {
                    nextRow.click();
                    activeInput.style.left = `${getRow(nextRow.getAttribute("hash") || "").textElement.offsetWidth + 2}px`;
                }
                break;
            case "ArrowLeft":
                if (thisRow.activeColumnIndex === 0)
                    return;
                updateRow(rowHash, { activeColumnIndex: thisRow.activeColumnIndex - 1 });
                activeInput.style.left = `${Number(leftValue - charWidth(thisRow))}px`;
                break;
            case "ArrowRight":
                if (thisRow.activeColumnIndex >= thisRow.content.length)
                    return;
                updateRow(rowHash, { activeColumnIndex: thisRow.activeColumnIndex + 1 });
                activeInput.style.left = `${Number(leftValue + charWidth(thisRow))}px`;
                break;
            default:
                const firstPart = thisRow.content.slice(0, thisRow.activeColumnIndex) || "";
                const endPart = thisRow.content.slice(thisRow.activeColumnIndex) || "";
                const updatedRow = updateRow(rowHash, {
                    activeColumnIndex: thisRow.activeColumnIndex + 1,
                    content: [...firstPart, e.key, ...endPart]
                });
                input.style.left = `${charWidth(updatedRow) * (updatedRow.activeColumnIndex)}px`;
                break;
        }
        typingTimeout = setTimeout(() => {
            thisRow.element.classList.remove("typing");
        }, 200);
    });
    return input;
}
function deleteRow(hash) {
    if (!container)
        throw new Error("Container root not defined");
    const row = getRow(hash);
    if (rows.size === 1 && row.activeColumnIndex === 0)
        return;
    container.removeChild(row.element);
    rows.delete(hash);
}
function createRow(content) {
    if (!container)
        throw new Error("Container root not defined");
    const hash = String(Math.trunc(Math.random() * 10000));
    const row = Object.assign(document.createElement("pre"), { hash });
    const textElement = document.createElement("p");
    rows.set(hash, {
        content: content?.split("") || [],
        element: row,
        textElement: textElement,
        activeColumnIndex: content?.length || 0
    });
    row.id = "row";
    row.setAttribute("hash", hash);
    row.appendChild(textElement);
    textElement.textContent = content || "";
    row.addEventListener("click", (e) => {
        if (!(e.currentTarget instanceof HTMLPreElement))
            return;
        if (!activeRow) {
            activeRow = row;
            createInput(activeRow);
        }
        if (e.currentTarget.getAttribute("hash") !== activeRow.getAttribute("hash")) {
            deleteInput(activeInput, activeRow);
            activeRow.classList.remove("active");
            activeRow = row;
            createInput(activeRow);
        }
        if (!activeInput)
            return;
        row.classList.add("active");
        const leftValue = getRow(hash).activeColumnIndex * charWidth(getRow(hash));
        activeInput.style.left = `${leftValue}px`;
        row.appendChild(activeInput);
        activeInput.focus();
    });
    return row;
}
function deleteInput(input, row) {
    if (!input)
        return;
    row.removeChild(input);
    activeInput = null;
}
function updateRow(hash, row) {
    rows.set(hash, { ...getRow(hash), ...row });
    if (row && row.content) {
        getRow(hash).textElement.textContent = row.content.join("");
    }
    return getRow(hash);
}
function getRow(hash) {
    const row = rows.get(hash);
    if (!row)
        throw new Error("Row not found");
    return row;
}
(() => {
    container.style.height = HEIGHT.toString();
    container.style.width = WIDTH.toString();
    const row = createRow();
    container.appendChild(row);
})();

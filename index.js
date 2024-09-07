"use strict";
const container = document.getElementById("container");
const wrapper = document.getElementById("wrapper");
if (!container || !wrapper)
    throw new Error("Container root not found");
const WIDTH = 1400;
const HEIGHT = 800;
const ROWS_COUNT = HEIGHT / 50;
const COLS_COUNT = WIDTH / 25;
let activeRow = null;
let activeInput = null;
let activeColumn = 0;
const rows = new Map();
let typingTimeout;
const UNSUPPORTED_KEYS = ["ShiftRight", "AltRight", "MetaRight", "ControlRight", "ShiftLeft", "AltLeft", "MetaLeft", "ControlLeft", "CapsLock", "Tab", "Delete", "Insert"];
function getRowColumn(hash) {
    return rows.get(hash);
}
function charWidth(row) {
    return (row.textElement.offsetWidth / row.content.length) || 0;
}
function handleKey(e, hash) {
    if (!(e instanceof KeyboardEvent) || UNSUPPORTED_KEYS.includes(e.code) || !activeInput || !activeRow)
        return;
    getRow(hash).element.classList.add("typing");
    clearTimeout(typingTimeout);
    switch (e.code) {
        case "Backspace":
            if (!Boolean(getRow(hash).textElement.textContent)) {
                const prevElement = getRow(hash).element.previousElementSibling;
                const nextElement = getRow(hash).element.nextElementSibling;
                if (prevElement instanceof HTMLPreElement) {
                    prevElement.click();
                }
                else if (nextElement instanceof HTMLPreElement) {
                    nextElement.click();
                }
                deleteRow(getRow(hash).element.getAttribute("hash") || "");
                break;
            }
            ;
            if (getRow(hash).textElement.textContent && activeColumn === 0) {
                const prevRow = getRow(hash).element.previousElementSibling;
                if (!prevRow)
                    return;
                updateRow(prevRow.hash, {
                    content: [...getRow(prevRow.hash).content, getRow(hash).textElement.textContent || ""],
                });
                prevRow.click();
                activeInput.style.left = `${activeColumn * charWidth(getRow(prevRow.hash))}px`;
                deleteRow(getRow(hash).element.getAttribute("hash") || "");
                break;
            }
            const beforeCursor = getRow(hash).content.slice(0, activeColumn - 1);
            const afterCursor = getRow(hash).content.slice(activeColumn);
            updateRow(hash, { content: [...beforeCursor, ...afterCursor] });
            activeColumn -= 1;
            activeInput.style.left = `${activeColumn * charWidth(getRow(hash))}px`;
            break;
        case "Enter":
            activeRow?.element.classList.remove("typing");
            const remainderContent = getRow(hash).textElement.textContent?.slice(activeColumn) || "";
            updateRow(hash, { content: getRow(hash).content.splice(0, activeColumn) });
            const newRow = createRow(remainderContent);
            container?.insertBefore(newRow, getRow(hash).element.nextSibling);
            activeColumn = 0;
            newRow.click();
            break;
        case "ArrowUp":
            activeRow?.element.classList.remove("typing");
            const prevRow = getRow(hash).element.previousElementSibling;
            if (prevRow instanceof HTMLPreElement) {
                prevRow.click();
            }
            break;
        case "ArrowDown":
            activeRow?.element.classList.remove("typing");
            const nextRow = getRow(hash).element.nextElementSibling;
            if (nextRow instanceof HTMLPreElement) {
                nextRow.click();
            }
            break;
        case "ArrowLeft":
            if (activeColumn === 0)
                return;
            activeColumn -= 1;
            activeInput.style.left = `${activeColumn * charWidth(getRow(hash))}px`;
            break;
        case "ArrowRight":
            if (activeColumn >= getRow(hash).content.length)
                return;
            activeColumn += 1;
            activeInput.style.left = `${activeColumn * charWidth(getRow(hash))}px`;
            break;
        default:
            const firstPart = getRow(hash).content.slice(0, activeColumn) || "";
            const endPart = getRow(hash).content.slice(activeColumn) || "";
            updateRow(hash, { content: [...firstPart, e.key, ...endPart] });
            activeColumn += 1;
            activeInput.style.left = `${activeColumn * charWidth(getRow(hash))}px`;
            break;
    }
    typingTimeout = setTimeout(() => {
        activeRow?.element.classList.remove("typing");
    }, 200);
    setLoc();
}
function setLoc() {
    const loc = document.getElementById("loc");
    if (!loc)
        throw new Error("Location container not found");
    const activeRowIndex = activeRow ? Array.from(rows.keys()).indexOf(activeRow.hash) : 0;
    loc.textContent = `${activeRowIndex}:${activeColumn}`;
}
function createInput(row) {
    const input = document.createElement("input");
    input.value = row.content.join("");
    input.style.height = "30px";
    input.style.width = "16px";
    input.style.backgroundColor = "#bbb";
    input.autocomplete = "off";
    input.spellcheck = false;
    activeInput = input;
    input.addEventListener("keydown", (e) => handleKey(e, row.hash));
    return input;
}
function deleteRow(hash) {
    if (!container)
        throw new Error("Container root not defined");
    const row = getRow(hash);
    if (rows.size === 1 && activeColumn === 0)
        return;
    container.removeChild(row.element);
    rows.delete(hash);
}
function generateHash() {
    const hash = String(Math.trunc(Math.random() * 100_000));
    if (document.querySelector(`[hash="${hash}"]`))
        return generateHash();
    return hash;
}
function createRow(content) {
    if (!container)
        throw new Error("Container root not defined");
    const hash = generateHash();
    const row = Object.assign(document.createElement("pre"), { hash });
    const textElement = document.createElement("p");
    rows.set(hash, {
        hash,
        content: content?.split("") || [],
        element: row,
        textElement: textElement,
    });
    row.id = "row";
    row.setAttribute("hash", hash);
    row.appendChild(textElement);
    textElement.textContent = content || "";
    row.addEventListener("click", (e) => {
        if (!(e.currentTarget instanceof HTMLPreElement))
            return;
        if (!activeRow) {
            activeRow = getRow(row.hash);
            createInput(activeRow);
        }
        if (e.currentTarget.getAttribute("hash") !== activeRow.hash) {
            deleteInput(activeInput, activeRow);
            activeRow.element.classList.remove("active");
            activeRow = getRow(row.hash);
            createInput(activeRow);
        }
        if (!activeInput)
            return;
        row.classList.add("active");
        if (getRow(row.hash).content.length < activeColumn)
            activeColumn = getRow(row.hash).content.length;
        const leftValue = activeColumn * charWidth(getRow(hash));
        activeInput.style.left = `${leftValue}px`;
        row.appendChild(activeInput);
        activeInput.focus();
    });
    addNumbering();
    return row;
}
function addNumbering() {
    const n = document.createElement("span");
    n.textContent = String(rows.size);
    document.getElementById("numbering")?.appendChild(n);
}
function deleteInput(input, row) {
    if (!input)
        return;
    row.element.removeChild(input);
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
    wrapper.style.height = HEIGHT.toString();
    wrapper.style.width = WIDTH.toString();
    const loc = document.createElement("div");
    loc.id = "loc";
    const numbering = document.createElement("div");
    numbering.id = "numbering";
    const row = createRow();
    container.appendChild(row);
    wrapper.appendChild(numbering);
    wrapper.appendChild(loc);
    setLoc();
    addNumbering();
})();

const container = document.getElementById("container");
if (!container) throw new Error("Container root not found");

const WIDTH = 1000;
const HEIGHT = 1000;
const ROWS_COUNT = HEIGHT / 50;
const COLS_COUNT = WIDTH / 25;

let activeRow: HTMLSpanElement | null = null;
let activeInput: HTMLInputElement | null = null;

const rows = Array(ROWS_COUNT).fill(Array(COLS_COUNT).fill(undefined));

function createInput(row: HTMLSpanElement) {
  const input = document.createElement("input");

  input.style.height = "0";
  input.style.width = "0";
  activeInput = input;

  input.addEventListener("input", (e: Event) => {
    if (e instanceof InputEvent) {
      const { data, inputType } = e;
      console.log({data, inputType});

      switch(inputType) {
      case "insertText":
	row.append(data!);
	break;
      case "deleteContentBackward":
//	row.(row?.textContent?.slice(0, row.textContent.length - 1))
	break;
      }

    }
  });
  
  return input
}

function removeInput(input: HTMLInputElement | null, row: HTMLSpanElement) {
  if (!input) return;
  row.removeChild(input);
  row.style.position = "static";
  activeInput = null;
}

(() => {
  const rows = [];
  container.style.height = HEIGHT.toString();
  container.style.width = WIDTH.toString();

  for (let i = 0; i < ROWS_COUNT; i++) {
    const row = document.createElement("pre");
    row.id = "row";
    row.dataset.nth = i.toString();

    // for (let j = 0; j < COLS_COUNT; j++) {
    //   const col = document.createElement("span");
    //   row.appendChild(col);
    // }
     
    row.addEventListener("click", (e: MouseEvent) => {
      if (e.currentTarget instanceof HTMLPreElement) {
	if (!activeRow) {
	  activeRow = row;
	  const input = createInput(activeRow);
	  row.appendChild(input);
	  input.focus();
	} else if (e.currentTarget.dataset.nth !== activeRow.dataset.nth) {
	  removeInput(activeInput, activeRow);
	  activeRow = row;
	  const input = createInput(activeRow);
	  row.appendChild(input);
	  input.focus();
	}
      }
    })
    
    container.appendChild(row);
  }
})()

const a = {
  name: "leonardo",
  getName() {
    return this.name
  },
};

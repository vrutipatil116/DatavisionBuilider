
export function deleteRow(data: any[], rowIndex: number) {
  return data.filter((_, i) => i !== rowIndex);
}

export function editRow(data: any[], rowIndex: number, newRow: any) {
  return data.map((row, i) => (i === rowIndex ? newRow : row));
}

export function fillMissingInRow(data: any[], rowIndex: number, fillValue = "N/A") {
  const row = data[rowIndex];
  const updated = { ...row };

  Object.keys(updated).forEach(col => {
    if (updated[col] === null || updated[col] === undefined || updated[col] === "") {
        updated[col] = fillValue;
    }
  });

  return data.map((r, i) => (i === rowIndex ? updated : r));
}

export function fixMixedTypesInRow(data: any[], rowIndex: number) {
  const row = data[rowIndex];
  const updated: any = {};

  Object.keys(row).forEach(col => {
    updated[col] = String(row[col] ?? "");
  });

  return data.map((r, i) => (i === rowIndex ? updated : r));
}

export function normalizeDatesInRow(data: any[], rowIndex: number) {
  const row = data[rowIndex];
  const updated = { ...row };

  Object.keys(updated).forEach(col => {
    const val = updated[col];
    if (typeof val === 'string' && (val.includes('/') || val.includes('-'))) {
        const parsed = Date.parse(val);
        if (!isNaN(parsed)) {
          const d = new Date(parsed);
          updated[col] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(d.getDate()).padStart(2, "0")}`;
        }
    }
  });

  return data.map((r, i) => (i === rowIndex ? updated : r));
}

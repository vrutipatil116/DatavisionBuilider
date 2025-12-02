
export function updateCellValue(data: any[], rowIndex: number, column: string, newValue: any) {
  return data.map((row, i) => {
    if (i !== rowIndex) return row;
    return { ...row, [column]: newValue };
  });
}

export function fillEmptyCell(data: any[], rowIndex: number, column: string, fillValue = "N/A") {
  return data.map((row, i) => {
    if (i !== rowIndex) return row;
    return {
      ...row,
      [column]: row[column] ? row[column] : fillValue
    };
  });
}

export function normalizeCellDate(data: any[], rowIndex: number, column: string) {
  return data.map((row, i) => {
    if (i !== rowIndex) return row;

    const val = row[column];
    const parsed = Date.parse(val);
    if (isNaN(parsed)) return row;

    const d = new Date(parsed);
    return {
      ...row,
      [column]: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    };
  });
}

export function convertCellToString(data: any[], rowIndex: number, column: string) {
  return data.map((row, i) => {
    if (i !== rowIndex) return row;
    return { ...row, [column]: String(row[column]) };
  });
}

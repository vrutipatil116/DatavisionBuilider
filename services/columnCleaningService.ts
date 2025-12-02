
export function deleteColumn(data: any[], column: string) {
  return data.map(row => {
    const updated = { ...row };
    delete updated[column];
    return updated;
  });
}

export function fillMissingInColumn(data: any[], column: string, fillValue = "N/A") {
  return data.map(row => ({
    ...row,
    [column]: (row[column] !== null && row[column] !== undefined && row[column] !== "") ? row[column] : fillValue
  }));
}

export function convertColumnToString(data: any[], column: string) {
  return data.map(row => ({
    ...row,
    [column]: String(row[column] ?? "")
  }));
}

export function normalizeColumnDates(data: any[], column: string) {
  return data.map(row => {
    const val = row[column];
    if (!val) return row;
    
    const parsed = Date.parse(val);
    if (isNaN(parsed)) return row;

    const d = new Date(parsed);
    return {
      ...row,
      [column]: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`
    };
  });
}

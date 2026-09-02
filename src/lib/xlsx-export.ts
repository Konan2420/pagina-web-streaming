import * as XLSX from "xlsx";

type SpreadsheetValue = string | number | null | undefined;

/** Descarga un archivo .xlsx real compatible con Excel, Numbers y Google Sheets. */
export function downloadXlsx(filename: string, headers: string[], rows: SpreadsheetValue[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

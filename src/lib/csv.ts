import { downloadFile } from './utils';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | string[] | null | undefined;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = Array.isArray(value) ? value.join('; ') : String(value);
  const escaped = raw.replace(/"/g, '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(','));
  return [header, ...body].join('\r\n');
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const csv = `\uFEFF${toCsv(rows, columns)}`;
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
}

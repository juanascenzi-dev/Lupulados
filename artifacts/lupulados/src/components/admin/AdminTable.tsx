import type { ReactNode } from "react";

export function AdminTable<T>({
  rows,
  columns,
  render,
}: {
  rows: T[];
  columns: string[];
  render: (row: T) => ReactNode[];
}) {
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">Sin datos para mostrar.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 bg-card">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="p-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/10">
              {render(row).map((cell, cellIndex) => (
                <td key={cellIndex} className="p-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

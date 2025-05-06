import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, ReactNode } from "react";

interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchable?: boolean;
  searchField?: keyof T;
  emptyText?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Buscar...",
  searchable = true,
  searchField,
  emptyText = "Nenhum registro encontrado",
  isLoading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = searchable && searchField && searchQuery
    ? data.filter(item => {
        const field = item[searchField];
        if (typeof field === 'string') {
          return field.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (field && typeof field === 'object' && 'toString' in field) {
          return field.toString().toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      })
    : data;

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-icons text-neutral-medium text-lg">search</span>
          </span>
          <Input
            type="text"
            className="bg-white w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header as string}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.header as string}>
                      {column.cell ? column.cell(row) : row[column.accessorKey] as ReactNode}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

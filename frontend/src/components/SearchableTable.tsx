import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SearchableTableProps<T> {
  title: string;
  data: T[];
  columns?: { key: keyof T; label: string }[];
  maxHeight?: string;
}

const getColumnsFromData = <T extends Record<string, unknown>>(data: T[]): { key: keyof T; label: string }[] => {
  if (!data || data.length === 0) return [];
  const keyBlacklist = ['geom']; // Don't show geometry columns
  const keys = Object.keys(data[0]).filter(key => !keyBlacklist.includes(key));
  return keys.map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }));
};

const SearchableTable = <T extends Record<string, unknown>>({ title, data, columns, maxHeight = '70vh' }: SearchableTableProps<T>) => {
  const [filter, setFilter] = useState('');

  const tableColumns = useMemo(() => columns || getColumnsFromData(data), [columns, data]);

  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter(row =>
      tableColumns.some(({ key }) => 
        String(row[key] ?? '').toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter, tableColumns]);

  const exportToXLSX = () => {
    // Prepare data for export
    const exportData = filteredData.map(row => {
      const exportRow: Record<string, unknown> = {};
      tableColumns.forEach(col => {
        const value = row[col.key];
        exportRow[col.label] = typeof value === 'boolean' 
          ? (value ? 'Yes' : 'No') 
          : (value ?? 'N/A');
      });
      return exportRow;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const columnWidths = tableColumns.map(col => ({
      wch: Math.max(col.label.length, 15) // minimum 15 characters width
    }));
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, title);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${title.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  if (!data || data.length === 0) {
    return null; // Don't render anything if there's no data
  }

  return (
    <div className="card bg-base-100 border border-gray-200/80 shadow-md w-full mb-6 flex flex-col">
      <div className="card-body p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="card-title text-lg font-bold mb-2 sm:mb-0">{title}</h2>
           <div className="flex items-center gap-4">
            <button
              onClick={exportToXLSX}
              className="btn btn-outline btn-primary btn-sm gap-2"
              title="Export to Excel"
            >
              <Download className="h-4 w-4" />
              Export XLSX
            </button>
            <span className="text-sm text-gray-500 font-medium">{filteredData.length} of {data.length} rows</span>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                type="text"
                placeholder={`Search ${title}...`}
                className="input input-bordered pl-10 w-full sm:w-64"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                />
            </div>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight }}>
          <table className="table w-full table-zebra table-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {tableColumns.map(col => <th key={String(col.key)} className="p-3 font-semibold text-left">{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover">
                  {tableColumns.map(col => (
                    <td key={`${rowIndex}-${String(col.key)}`} className="p-3">
                      {typeof row[col.key] === 'boolean' 
                        ? row[col.key] ? 'Yes' : 'No' 
                        : String(row[col.key] ?? 'N/A')}
                    </td>
                  ))}
                </tr>
              ))}
                {filteredData.length === 0 && (
                    <tr>
                        <td colSpan={tableColumns.length} className="text-center p-4">
                            No results found for your search.
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SearchableTable; 
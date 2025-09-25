import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  preview: any[];
}

export class FileParser {
  static async parseFile(file: File): Promise<ParsedData> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      return this.parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parseExcel(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel files.');
    }
  }

  private static async parseCSV(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            return;
          }

          const data = results.data as string[][];
          if (data.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          const headers = data[0];
          const rows = data.slice(1);
          const preview = rows.slice(0, 5).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          resolve({
            headers,
            rows,
            totalRows: rows.length,
            preview,
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private static async parseExcel(file: File): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            reject(new Error('Excel file has no worksheets'));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null 
          }) as any[][];

          if (jsonData.length === 0) {
            reject(new Error('Excel worksheet is empty'));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
          const preview = rows.slice(0, 5).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          resolve({
            headers,
            rows,
            totalRows: rows.length,
            preview,
          });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static inferColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
    if (values.length === 0) return 'string';

    // Filter out null/undefined values
    const validValues = values.filter(val => val !== null && val !== undefined && val !== '');
    if (validValues.length === 0) return 'string';

    // Check for numbers
    const numericValues = validValues.filter(val => !isNaN(parseFloat(val)) && isFinite(val));
    if (numericValues.length > validValues.length * 0.8) return 'number';

    // Check for dates
    const dateValues = validValues.filter(val => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date.getFullYear() > 1900;
    });
    if (dateValues.length > validValues.length * 0.8) return 'date';

    // Check for booleans
    const booleanValues = validValues.filter(val => {
      const str = String(val).toLowerCase();
      return ['true', 'false', 'yes', 'no', '1', '0', 'on', 'off'].includes(str);
    });
    if (booleanValues.length > validValues.length * 0.8) return 'boolean';

    return 'string';
  }
}

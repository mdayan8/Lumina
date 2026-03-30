import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as fs from 'fs';

export interface FileSchema {
  columns: Array<{
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    samples: any[];
  }>;
  totalRows: number;
  previewData: any[];
}

export class FileProcessor {
  static async processFile(filePath: string, originalFilename: string): Promise<FileSchema> {
    const extension = originalFilename.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return this.processCSV(filePath);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.processExcel(filePath);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel files.');
    }
  }

  private static async processCSV(filePath: string): Promise<FileSchema> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const previewRows: any[] = [];
      let totalRows = 0;
      let headers: string[] = [];
      let isHeader = true;

      Papa.parse(fileStream, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        step: (results) => {
          if (results.errors.length > 0) {
            // Log error but continue if possible? Or just fail?
            // For now, let's ignore minor parsing errors in individual rows
          }

          if (results.data) {
            totalRows++;
            if (previewRows.length < 10) {
              previewRows.push(results.data);
            }
            if (isHeader) {
              headers = results.meta.fields || Object.keys(results.data as any);
              isHeader = false;
            }
          }
        },
        complete: () => {
          resolve(this.analyzeData(previewRows, totalRows));
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private static processExcel(filePath: string): FileSchema {
    // XLSX.readFile is more efficient than reading to buffer
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
    });

    if (jsonData.length === 0) {
      throw new Error('Excel file is empty or has no readable data.');
    }

    // Convert array of arrays to array of objects
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    const objectData = dataRows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = (row as any[])[index] ?? null;
      });
      return obj;
    });

    return this.analyzeData(objectData, objectData.length);
  }

  private static analyzeData(data: any[], totalRows: number): FileSchema {
    if (data.length === 0) {
      // Return empty schema if no data, but don't crash
      return {
        columns: [],
        totalRows: 0,
        previewData: [],
      };
    }

    const sample = data[0];
    const columns = Object.keys(sample).map(columnName => {
      const columnData = data.map(row => row[columnName]).filter(val => val !== null && val !== undefined);
      const samples = columnData.slice(0, 5); // Get first 5 non-null samples
      const type = this.inferColumnType(columnData);

      return {
        name: columnName,
        type,
        samples,
      };
    });

    return {
      columns,
      totalRows: totalRows,
      previewData: data.slice(0, 10), // First 10 rows for preview
    };
  }

  private static inferColumnType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
    if (values.length === 0) return 'string';

    // Check for numbers
    const numericValues = values.filter(val => typeof val === 'number' || !isNaN(parseFloat(val)));
    if (numericValues.length > values.length * 0.8) return 'number';

    // Check for dates
    const dateValues = values.filter(val => !isNaN(Date.parse(val)));
    if (dateValues.length > values.length * 0.8) return 'date';

    // Check for booleans
    const booleanValues = values.filter(val =>
      typeof val === 'boolean' ||
      (typeof val === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(val.toLowerCase()))
    );
    if (booleanValues.length > values.length * 0.8) return 'boolean';

    return 'string';
  }
}

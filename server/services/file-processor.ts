import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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
  static async processFile(buffer: Buffer, filename: string): Promise<FileSchema> {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'csv') {
      return this.processCSV(buffer);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.processExcel(buffer);
    } else {
      throw new Error('Unsupported file format. Please upload CSV or Excel files.');
    }
  }

  private static processCSV(buffer: Buffer): FileSchema {
    const text = buffer.toString('utf-8');
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }

    return this.analyzeData(parsed.data);
  }

  private static processExcel(buffer: Buffer): FileSchema {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
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

    return this.analyzeData(objectData);
  }

  private static analyzeData(data: any[]): FileSchema {
    if (data.length === 0) {
      throw new Error('No data found in file.');
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
      totalRows: data.length,
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

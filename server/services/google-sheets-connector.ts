import { parse } from 'csv-parse/sync';

export class GoogleSheetsConnector {
    /**
     * Extracts the spreadsheet ID from a Google Sheets URL.
     */
    private extractSpreadsheetId(url: string): string | null {
        const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return matches ? matches[1] : null;
    }

    /**
     * Fetches a public Google Sheet as a CSV and parses it.
     * @param url The full URL of the Google Sheet
     */
    async fetchPublicSheet(url: string): Promise<{ data: any[], columns: string[] }> {
        const spreadsheetId = this.extractSpreadsheetId(url);
        if (!spreadsheetId) {
            throw new Error("Invalid Google Sheets URL. Could not find Spreadsheet ID.");
        }

        // Construct the CSV export URL
        // gid=0 usually refers to the first sheet. We can make this configurable later.
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;

        try {
            const response = await fetch(csvUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch sheet: ${response.statusText}. Make sure the sheet is visible to "Anyone with the link".`);
            }

            const csvText = await response.text();

            // Parse CSV
            const records = parse(csvText, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            if (records.length === 0) {
                return { data: [], columns: [] };
            }

            const columns = Object.keys(records[0] as object);

            return {
                data: records,
                columns
            };

        } catch (error: any) {
            throw new Error(`Google Sheets Error: ${error.message}`);
        }
    }

    /**
     * Validates if a string is a likely Google Sheets URL
     */
    isValidUrl(url: string): boolean {
        return url.includes('docs.google.com/spreadsheets');
    }
}

export const googleSheetsConnector = new GoogleSheetsConnector();

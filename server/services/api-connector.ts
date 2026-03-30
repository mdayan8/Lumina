export class ApiConnector {
    /**
     * Fetches data from a generic REST API.
     * @param url The API endpoint URL
     * @param headers Optional headers (e.g., Authorization)
     */
    async fetchData(url: string, headers: Record<string, string> = {}): Promise<{ data: any[], columns: string[] }> {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const jsonData = await response.json();

            // Normalize data to an array of objects
            let data: any[] = [];

            if (Array.isArray(jsonData)) {
                data = jsonData;
            } else if (typeof jsonData === 'object' && jsonData !== null) {
                // Try to find an array property
                const arrayProp = Object.values(jsonData).find(val => Array.isArray(val));
                if (arrayProp) {
                    data = arrayProp as any[];
                } else {
                    // Treat the single object as one row
                    data = [jsonData];
                }
            } else {
                throw new Error("API response is not a JSON array or object.");
            }

            if (data.length === 0) {
                return { data: [], columns: [] };
            }

            // Extract columns from the first item (flattening nested objects could be an enhancement)
            // For now, we just take top-level keys
            const columns = Object.keys(data[0]);

            return {
                data,
                columns
            };

        } catch (error: any) {
            throw new Error(`API Connector Error: ${error.message}`);
        }
    }
}

export const apiConnector = new ApiConnector();

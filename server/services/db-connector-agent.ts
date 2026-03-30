import { Client } from "pg";

export class DBConnectorAgent {
    private static instance: DBConnectorAgent;

    private constructor() { }

    public static getInstance(): DBConnectorAgent {
        if (!DBConnectorAgent.instance) {
            DBConnectorAgent.instance = new DBConnectorAgent();
        }
        return DBConnectorAgent.instance;
    }

    async testConnection(connectionString: string): Promise<{ success: boolean; error?: string }> {
        const client = new Client({ connectionString });
        try {
            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    async executeQuery(connectionString: string, query: string): Promise<any> {
        // Enforce read-only
        if (!this.isReadOnly(query)) {
            throw new Error("Only read-only queries (SELECT) are allowed.");
        }

        const client = new Client({ connectionString });
        try {
            await client.connect();
            const result = await client.query(query);
            await client.end();
            return result.rows;
        } catch (error: any) {
            try { await client.end(); } catch (e) { }
            throw error;
        }
    }

    async getSchema(connectionString: string): Promise<any> {
        const query = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `;

        const rows = await this.executeQuery(connectionString, query);

        // Group by table
        const schema: any = {};
        rows.forEach((row: any) => {
            if (!schema[row.table_name]) {
                schema[row.table_name] = [];
            }
            schema[row.table_name].push({
                name: row.column_name,
                type: row.data_type
            });
        });

        return schema;
    }

    private isReadOnly(query: string): boolean {
        const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'];
        const upperQuery = query.toUpperCase().trim();

        // Must start with SELECT or WITH (CTE)
        if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
            return false;
        }

        // Check for forbidden keywords
        return !forbiddenKeywords.some(keyword => upperQuery.includes(keyword));
    }
}


export const dbConnector = DBConnectorAgent.getInstance();

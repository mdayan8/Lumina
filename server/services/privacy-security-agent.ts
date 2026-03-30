export class PrivacySecurityAgent {
    private static PII_PATTERNS = {
        email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
    };

    async scanAndRedact(data: any[]): Promise<{ cleanedData: any[], findings: any }> {
        const findings: any = {
            email: 0,
            phone: 0,
            ssn: 0,
            creditCard: 0,
            ip: 0
        };

        const cleanedData = data.map(row => {
            const newRow = { ...row };

            Object.keys(newRow).forEach(key => {
                const value = String(newRow[key]);

                // Check each pattern
                Object.entries(PrivacySecurityAgent.PII_PATTERNS).forEach(([type, pattern]) => {
                    if (pattern.test(value)) {
                        findings[type]++;
                        newRow[key] = '[REDACTED]';
                    }
                });
            });

            return newRow;
        });

        return { cleanedData, findings };
    }

    validateQuery(query: string): boolean {
        const forbiddenKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE'];
        const upperQuery = query.toUpperCase();

        return !forbiddenKeywords.some(keyword => upperQuery.includes(keyword));
    }
}

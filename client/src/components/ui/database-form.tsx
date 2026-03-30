import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Database as DatabaseIcon, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface DatabaseFormProps {
    onFileUploaded: (file: any, summaryMessage?: any) => void;
}

export function DatabaseForm({ onFileUploaded }: DatabaseFormProps) {
    const [connectionString, setConnectionString] = useState('');
    const [tableName, setTableName] = useState('');
    const [query, setQuery] = useState('');
    const [useCustomQuery, setUseCustomQuery] = useState(false);
    const [connectionTested, setConnectionTested] = useState(false);
    const { toast } = useToast();

    const testMutation = useMutation({
        mutationFn: async (connString: string) => {
            const token = localStorage.getItem("authToken");

            const response = await fetch('/api/connect/database', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connectionString: connString,
                    query: 'SELECT 1',
                    tableName: undefined
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Connection test failed');
            }

            return response.json();
        },
        onSuccess: () => {
            setConnectionTested(true);
            toast({
                title: "Connection successful!",
                description: "Database connection is working.",
            });
        },
        onError: (error) => {
            setConnectionTested(false);
            toast({
                variant: "destructive",
                title: "Connection failed",
                description: error.message,
            });
        }
    });

    const connectMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem("authToken");

            const response = await fetch('/api/connect/database', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    connectionString,
                    query: useCustomQuery ? query : undefined,
                    tableName: useCustomQuery ? undefined : tableName
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to connect to database');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Database connected!",
                description: `Loaded ${data.schema.columns.length} columns and ${data.schema.totalRows} rows.`,
            });

            // Create a welcome message for the chat
            const welcomeMessage = {
                id: 'welcome',
                type: 'ai',
                content: "Hi! Your database data has been loaded successfully.",
                explanation: "I've imported your data and analyzed its structure, including column names and data types.",
                method: "Database Import",
                confidence: 98,
                dataPoints: data.schema.totalRows,
                timestamp: new Date(),
                preview: {
                    columns: data.schema.columns,
                    rowCount: data.schema.totalRows,
                    sampleRows: data.schema.previewData || []
                }
            };

            onFileUploaded(data.file, welcomeMessage);
            setConnectionString('');
            setTableName('');
            setQuery('');
            setConnectionTested(false);
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Connection failed",
                description: error.message,
            });
        }
    });

    const handleTestConnection = () => {
        if (!connectionString.trim()) {
            toast({
                variant: "destructive",
                title: "Connection string required",
                description: "Please enter a database connection string",
            });
            return;
        }
        testMutation.mutate(connectionString);
    };

    const handleConnect = () => {
        if (!connectionString.trim()) {
            toast({
                variant: "destructive",
                title: "Connection string required",
                description: "Please enter a database connection string",
            });
            return;
        }

        if (!useCustomQuery && !tableName.trim()) {
            toast({
                variant: "destructive",
                title: "Table name required",
                description: "Please enter a table name or use a custom query",
            });
            return;
        }

        if (useCustomQuery && !query.trim()) {
            toast({
                variant: "destructive",
                title: "Query required",
                description: "Please enter a SQL query",
            });
            return;
        }

        connectMutation.mutate();
    };

    const isLoading = connectMutation.isPending || testMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="conn-string">Connection String (PostgreSQL)</Label>
                <Input
                    id="conn-string"
                    type="text"
                    placeholder="postgresql://user:password@localhost:5432/database"
                    value={connectionString}
                    onChange={(e) => {
                        setConnectionString(e.target.value);
                        setConnectionTested(false);
                    }}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Only read-only SELECT queries are allowed for security
                </p>
            </div>

            <Button
                onClick={handleTestConnection}
                disabled={isLoading || !connectionString.trim()}
                variant="outline"
                className="w-full"
            >
                {testMutation.isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                    </>
                ) : connectionTested ? (
                    <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Connection Verified
                    </>
                ) : (
                    <>
                        <DatabaseIcon className="w-4 h-4 mr-2" />
                        Test Connection
                    </>
                )}
            </Button>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="custom-query"
                        checked={useCustomQuery}
                        onChange={(e) => setUseCustomQuery(e.target.checked)}
                        className="rounded"
                    />
                    <Label htmlFor="custom-query" className="cursor-pointer">
                        Use custom SQL query
                    </Label>
                </div>

                {useCustomQuery ? (
                    <div className="space-y-2">
                        <Label htmlFor="query">SQL Query</Label>
                        <Textarea
                            id="query"
                            placeholder="SELECT * FROM my_table WHERE ..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={isLoading}
                            rows={4}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="table-name">Table Name</Label>
                        <Input
                            id="table-name"
                            type="text"
                            placeholder="customers"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                )}
            </div>

            <Button
                onClick={handleConnect}
                disabled={isLoading || !connectionTested}
                className="w-full"
            >
                {connectMutation.isPending ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    <>
                        <DatabaseIcon className="w-4 h-4 mr-2" />
                        Import Data
                    </>
                )}
            </Button>

            {/* Security notice */}
            <Card className="bg-amber-500/10 border-amber-500/20">
                <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-amber-700 dark:text-amber-400">
                        🔒 Security Notice
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Only SELECT queries are allowed. Write operations (INSERT, UPDATE, DELETE) are blocked for security.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

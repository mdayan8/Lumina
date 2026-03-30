import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ExternalLink } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface GoogleSheetsFormProps {
    onFileUploaded: (file: any, summaryMessage?: any) => void;
}

export function GoogleSheetsForm({ onFileUploaded }: GoogleSheetsFormProps) {
    const [url, setUrl] = useState('');
    const { toast } = useToast();

    const connectMutation = useMutation({
        mutationFn: async (sheetUrl: string) => {
            const token = localStorage.getItem("authToken");

            const response = await fetch('/api/connect/google-sheets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: sheetUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to connect to Google Sheets');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Google Sheets connected!",
                description: `Loaded ${data.schema.columns.length} columns and ${data.schema.totalRows} rows.`,
            });

            // Create a welcome message for the chat
            const welcomeMessage = {
                id: 'welcome',
                type: 'ai',
                content: "Hi! Your Google Sheets data has been loaded successfully.",
                explanation: "I've imported your sheet and analyzed its structure, including column names and data types.",
                method: "Google Sheets Import",
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
            setUrl('');
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Connection failed",
                description: error.message,
            });
        }
    });

    const handleConnect = () => {
        if (!url.trim()) {
            toast({
                variant: "destructive",
                title: "URL required",
                description: "Please enter a Google Sheets URL",
            });
            return;
        }

        if (!url.includes('docs.google.com/spreadsheets')) {
            toast({
                variant: "destructive",
                title: "Invalid URL",
                description: "Please enter a valid Google Sheets URL",
            });
            return;
        }

        connectMutation.mutate(url);
    };

    const isLoading = connectMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="sheets-url">Google Sheets URL</Label>
                <Input
                    id="sheets-url"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
                <p className="text-xs text-muted-foreground">
                    The sheet must be public (Anyone with the link can view)
                </p>
            </div>

            <Button
                onClick={handleConnect}
                disabled={isLoading || !url.trim()}
                className="w-full"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect to Google Sheets
                    </>
                )}
            </Button>

            {/* How-to guide */}
            <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm">How to make your sheet public:</h4>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Open your Google Sheet</li>
                        <li>Click "Share" button (top right)</li>
                        <li>Change access to "Anyone with the link"</li>
                        <li>Set permission to "Viewer"</li>
                        <li>Copy the URL and paste it above</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}

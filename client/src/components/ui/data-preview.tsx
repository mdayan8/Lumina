import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Database } from "lucide-react";
import { useState } from "react";

interface DataPreviewProps {
    data: any[];
    fileName?: string;
}

export function DataPreview({ data, fileName }: DataPreviewProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
        <Card className="border-none shadow-none bg-muted/10">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium">
                        Data Preview: {fileName || "Uploaded File"}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                        ({data.length} rows)
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronUp className="w-4 h-4" />
                    )}
                </Button>
            </CardHeader>
            {!isCollapsed && (
                <CardContent className="p-0">
                    <ScrollArea className="h-[200px] w-full border-t">
                        <div className="p-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {columns.map((col) => (
                                            <TableHead key={col} className="whitespace-nowrap">
                                                {col}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, i) => (
                                        <TableRow key={i}>
                                            {columns.map((col) => (
                                                <TableCell key={`${i}-${col}`} className="whitespace-nowrap">
                                                    {typeof row[col] === "object"
                                                        ? JSON.stringify(row[col])
                                                        : String(row[col])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </CardContent>
            )}
        </Card>
    );
}

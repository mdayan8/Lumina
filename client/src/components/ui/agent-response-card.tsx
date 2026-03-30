import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowRight, Sparkles, Download, FileText, Database, Zap, ChevronRight, Clock, Brain, Droplets, BarChart } from 'lucide-react';
import { getAllAgents } from '@shared/agent-registry';
import { ChartRenderer } from "./chart-renderer";
import { ReportViewer } from './report-viewer';
import { downloadMarkdown, downloadJSON, downloadPDF } from '@/lib/download-utils';

const AGENT_ICONS: Record<string, any> = {
    Brain,
    FileText,
    Droplets,
    BarChart,
    Database,
    Sparkles,
    Zap
};

interface AgentResponseCardProps {
    agentId: string;
    agentName: string;
    agentColor?: string;
    summary: string;
    highlights?: string[];
    metrics?: Record<string, string | number>;
    chartData?: any;
    reportData?: any;
    onViewDetails: () => void;
}

export function AgentResponseCard({
    agentId,
    agentName,
    agentColor,
    summary,
    highlights = [],
    metrics = {},
    chartData,
    reportData,
    onViewDetails
}: AgentResponseCardProps) {
    // Get agent info from registry
    const agents = getAllAgents();
    const agent = agents.find(a => a.id === agentId);
    const color = agentColor || agent?.color || '#8B5CF6';

    const [showReport, setShowReport] = useState(false);

    // Get the proper icon component
    const IconComponent = agent ? AGENT_ICONS[agent.icon] : Sparkles;

    return (
        <Card
            className="border-l-4 hover:shadow-md transition-all duration-200"
            style={{ borderLeftColor: color }}
        >
            <CardContent className="p-4">
                {/* Agent Header */}
                <div className="flex items-center gap-2 mb-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-sm"
                        style={{
                            background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                            border: `1.5px solid ${color}30`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        {agent?.avatar ? (
                            <img
                                src={agent.avatar}
                                alt={agentName}
                                className="w-full h-full object-cover relative z-10"
                            />
                        ) : (
                            <IconComponent
                                className="w-5 h-5 relative z-10"
                                style={{ color }}
                            />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-sm" style={{ color }}>
                            {agentName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            AI Agent Response
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="mb-3">
                    <p className="text-sm leading-relaxed">{summary}</p>
                </div>

                {/* Highlights */}
                {highlights.length > 0 && (
                    <div className="mb-3 space-y-1">
                        {highlights.map((highlight, index) => (
                            <div
                                key={index}
                                className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                                <span className="text-primary mt-0.5">•</span>
                                <span className="flex-1">{highlight}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Metrics */}
                {Object.keys(metrics).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(metrics).map(([key, value]) => (
                            <Badge
                                key={key}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                    backgroundColor: `${color}15`,
                                    color: color,
                                    borderColor: `${color}30`
                                }}
                            >
                                {key}: {value}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Inline Chart */}
                {chartData && (
                    <div className="mb-4 mt-2 border rounded-lg p-2 bg-white/50">
                        <div className="text-xs font-semibold mb-2 text-muted-foreground">Generated Chart</div>
                        <div className="h-[200px] w-full">
                            <ChartRenderer
                                type={chartData.chartType || chartData.type}
                                data={chartData.data}
                                title={chartData.title}
                                description={chartData.description}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                    {reportData ? (
                        <>
                            <Button
                                className="flex-1 h-8 text-xs text-white hover:opacity-90"
                                style={{ backgroundColor: color }}
                                onClick={() => setShowReport(true)}
                            >
                                <FileText className="w-3 h-3 mr-1.5" />
                                View Full Report
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 px-2">
                                        <Download className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => downloadMarkdown(reportData)}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Markdown (.md)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadJSON(reportData)}>
                                        <Database className="w-4 h-4 mr-2" />
                                        JSON Data (.json)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => downloadPDF({
                                        ...reportData,
                                        generatedCharts: [
                                            ...(chartData ? [chartData] : []),
                                            ...(reportData.generatedCharts || [])
                                        ].filter((v, i, a) => a.findIndex(t => t.title === v.title) === i)
                                    })}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        PDF Report (.pdf)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Button
                            onClick={onViewDetails}
                            className="w-full text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: color }}
                            size="sm"
                        >
                            View Full Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </CardContent>

            {/* Full Report Viewer Modal */}
            {showReport && reportData && (
                <ReportViewer
                    reportData={reportData}
                    chartData={chartData}
                    onClose={() => setShowReport(false)}
                />
            )}
        </Card>
    );
}

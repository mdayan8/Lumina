import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllAgents } from '@shared/agent-registry';
import { Sparkles, FileText, Database, BarChart, Zap, Play, Clock, Loader2, ArrowLeft, History, CheckCircle, Trash2, Brain, Droplets } from 'lucide-react';
import { useState, useEffect } from 'react';
import { EnhancedAgentThinkingSteps, ThinkingStep } from './agent-thinking-steps';
import { ChartRenderer } from "./chart-renderer";
import { format } from 'date-fns';

const AGENT_ICONS: Record<string, any> = {
    Brain,
    Sparkles,
    FileText,
    Database,
    BarChart,
    Droplets,
    Zap
};

export function AgentsTab({ fileId, apiKey, initialResult }: { fileId?: string; apiKey?: string | null; initialResult?: any }) {
    const agents = getAllAgents();
    const [search, setSearch] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => {
        return localStorage.getItem('lumina_selected_agent') || null;
    });
    const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[] | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(initialResult || null);
    const [agentHistory, setAgentHistory] = useState<any[]>([]);

    // Simulated steps for animation
    useEffect(() => {
        if (!runningAgentId) return;

        const getSimulatedSteps = (agentId: string) => {
            const baseSteps = [
                { step: 1, description: "Initializing agent context...", status: 'completed' as const, duration: 200 },
                { step: 2, description: "Loading dataset...", status: 'in_progress' as const },
                { step: 3, description: "Analyzing data patterns...", status: 'pending' as const },
                { step: 4, description: "Generating results...", status: 'pending' as const }
            ];

            switch (agentId) {
                case 'scribe':
                    return [
                        { step: 1, description: "Reading dataset structure...", status: 'pending' as const },
                        { step: 2, description: "Identifying key insights...", status: 'pending' as const },
                        { step: 3, description: "Drafting report sections...", status: 'pending' as const },
                        { step: 4, description: "Formatting executive summary...", status: 'pending' as const },
                        { step: 5, description: "Finalizing PDF export...", status: 'pending' as const }
                    ];
                case 'viz':
                    return [
                        { step: 1, description: "Scanning data variables...", status: 'pending' as const },
                        { step: 2, description: "Determining optimal chart types...", status: 'pending' as const },
                        { step: 3, description: "Aggregating data points...", status: 'pending' as const },
                        { step: 4, description: "Rendering visualizations...", status: 'pending' as const }
                    ];
                case 'athena':
                    return [
                        { step: 1, description: "Decomposing user query...", status: 'pending' as const },
                        { step: 2, description: "Routing to sub-agents...", status: 'pending' as const },
                        { step: 3, description: "Synthesizing multi-agent results...", status: 'pending' as const },
                        { step: 4, description: "Constructing final response...", status: 'pending' as const }
                    ];
                default:
                    return baseSteps;
            }
        };

        const steps = getSimulatedSteps(runningAgentId);
        let currentStepIndex = 0;

        // Initial state
        setThinkingSteps([{ ...steps[0], status: 'in_progress' }]);

        const interval = setInterval(() => {
            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                setThinkingSteps(prev => {
                    if (!prev) return [];
                    const newSteps = [...prev];
                    // Mark previous as completed
                    if (newSteps[currentStepIndex - 1]) {
                        newSteps[currentStepIndex - 1] = {
                            ...newSteps[currentStepIndex - 1],
                            status: 'completed',
                            duration: 1500 // Simulated duration
                        };
                    }
                    // Add new step as in_progress
                    newSteps.push({ ...steps[currentStepIndex], status: 'in_progress' });
                    return newSteps;
                });
            }
        }, 2000); // Advance every 2 seconds

        return () => clearInterval(interval);
    }, [runningAgentId]);

    // Persist selected agent and clear state on change
    useEffect(() => {
        if (selectedAgentId) {
            localStorage.setItem('lumina_selected_agent', selectedAgentId);
        } else {
            localStorage.removeItem('lumina_selected_agent');
        }
        // Clear results when switching agents to prevent cross-contamination
        setAnalysisResult(null);
        setThinkingSteps(null);
    }, [selectedAgentId]);

    // Update analysis result if initialResult changes
    useEffect(() => {
        if (initialResult) {
            setAnalysisResult(initialResult);
            if (initialResult.thinkingSteps) {
                setThinkingSteps(initialResult.thinkingSteps);
            }
        }
    }, [initialResult]);

    // Fetch history when fileId changes
    const fetchHistory = async () => {
        if (!fileId) return;
        try {
            const res = await fetch(`/api/agent-sessions?fileId=${fileId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAgentHistory(data);

                // If we are running, check the latest session for progress
                if (runningAgentId && data.length > 0) {
                    const latestSession = data[0];
                    if (latestSession.status === 'completed') {
                        setAnalysisResult(latestSession.results);
                        if (latestSession.results?.thinkingSteps) {
                            setThinkingSteps(latestSession.results.thinkingSteps);
                        }
                        setRunningAgentId(null); // Stop running state if completed
                    }
                } else if (!runningAgentId && data.length > 0 && !analysisResult) {
                    // If not running and no result shown, show the latest session's result
                    // But only if we haven't selected one yet
                    if (data[0].results?.thinkingSteps) {
                        setThinkingSteps(data[0].results.thinkingSteps);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch agent history", err);
        }
    };

    // Polling effect
    useEffect(() => {
        fetchHistory();

        let interval: NodeJS.Timeout;
        if (runningAgentId) {
            interval = setInterval(fetchHistory, 1000); // Poll every second
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fileId, runningAgentId]);

    const handleRunAgent = async (agentId: string) => {
        if (!fileId || !apiKey) return;
        setRunningAgentId(agentId);
        setThinkingSteps(null);
        setAnalysisResult(null);
        try {
            fetch('/api/agents/auto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ fileId, apiKey, agentId })
            }).then(async (response) => {
                const data = await response.json();
                if (data.success) {
                    setAnalysisResult(data.result);
                    if (data.result.thinkingSteps) {
                        setThinkingSteps(data.result.thinkingSteps);
                    }
                    setRunningAgentId(null);
                    fetchHistory();
                } else {
                    console.error('Auto analysis failed', data.error);
                    setRunningAgentId(null);
                }
            }).catch(err => {
                console.error('Error calling auto endpoint', err);
                setRunningAgentId(null);
            });

        } catch (err) {
            console.error('Error starting agent', err);
            setRunningAgentId(null);
        }
    };

    const filteredAgents = agents.filter(agent =>
        agent.displayName.toLowerCase().includes(search.toLowerCase()) ||
        agent.description.toLowerCase().includes(search.toLowerCase())
    );

    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    const relevantHistory = agentHistory.filter(h => h.agentType === selectedAgentId);

    // Render Detail View
    if (selectedAgent) {
        const IconComponent = AGENT_ICONS[selectedAgent.icon] || Sparkles;
        return (
            <div className="p-6 h-full flex flex-col">
                <Button
                    variant="ghost"
                    className="self-start mb-4 pl-0 hover:bg-transparent"
                    onClick={() => setSelectedAgentId(null)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Agents
                </Button>

                <div className="flex items-start gap-4 mb-6">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${selectedAgent.color}20, ${selectedAgent.color}50)`,
                            border: `2px solid ${selectedAgent.color}40`
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        {selectedAgent.avatar ? (
                            <img
                                src={selectedAgent.avatar}
                                alt={selectedAgent.displayName}
                                className="w-full h-full object-cover relative z-10"
                            />
                        ) : (
                            <IconComponent
                                className="w-10 h-10 relative z-10"
                                style={{ color: selectedAgent.color }}
                            />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                        <p className="text-muted-foreground">{selectedAgent.description}</p>
                        <div className="flex gap-2 mt-2">
                            {selectedAgent.capabilities.map(cap => (
                                <Badge key={cap} variant="secondary" className="text-xs">
                                    {cap}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="ml-auto">
                        <Button
                            size="lg"
                            onClick={() => handleRunAgent(selectedAgent.id)}
                            disabled={!fileId || !apiKey || runningAgentId === selectedAgent.id}
                            style={{ backgroundColor: selectedAgent.color }}
                            className="text-white hover:opacity-90"
                        >
                            {runningAgentId === selectedAgent.id ? (
                                <div className="flex items-center gap-2">
                                    {/* Pulsing Avatar */}
                                    <div
                                        className="w-4 h-4 rounded flex items-center justify-center relative overflow-hidden animate-pulse"
                                        style={{
                                            background: `linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.5))`,
                                            border: `1px solid rgba(255,255,255,0.4)`
                                        }}
                                    >
                                        {selectedAgent.avatar ? (
                                            <img
                                                src={selectedAgent.avatar}
                                                alt={selectedAgent.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        )}
                                    </div>
                                    Running...
                                </div>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Run Agent
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                    {/* Left Column: History */}
                    <Card className="lg:col-span-1 flex flex-col min-h-0">
                        <CardHeader>
                            <CardTitle className="text-md flex items-center">
                                <History className="w-4 h-4 mr-2" />
                                Session History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-2">
                                    {relevantHistory.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-sm py-8">
                                            No history yet. Run the agent to see results.
                                        </div>
                                    ) : (
                                        relevantHistory.map((session) => (
                                            <div
                                                key={session.id}
                                                className={`p-3 rounded-lg border hover:bg-muted/50 transition-colors relative group cursor-pointer ${analysisResult === session.results ? 'bg-muted/50 border-primary/50' : ''}`}
                                                onClick={() => setAnalysisResult(session.results)}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        session.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {session.status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {session.createdAt ? format(new Date(session.createdAt), 'MMM d, h:mm a') : ''}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground line-clamp-2">
                                                    {session.results?.summary || session.results?.executiveSummary || "No summary available"}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete this session?')) {
                                                            try {
                                                                await fetch(`/api/agent-sessions/${session.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                                                                });
                                                                fetchHistory();
                                                            } catch (error) {
                                                                console.error('Failed to delete session:', error);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Right Column: Results */}
                    <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                        {thinkingSteps && (
                            <EnhancedAgentThinkingSteps
                                steps={thinkingSteps}
                                currentAgent={selectedAgent?.name}
                            />
                        )}

                        {analysisResult && (
                            <div className="space-y-6">
                                {/* Athena Result */}
                                {analysisResult.summary && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Analysis Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="prose prose-sm max-w-none">
                                                <p>{analysisResult.summary}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {analysisResult.insights && analysisResult.insights.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Key Insights</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                {analysisResult.insights.map((insight: any, i: number) => (
                                                    <div key={i} className="p-4 bg-muted/50 rounded-lg border">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="font-semibold text-sm">{insight.finding || insight.type}</div>
                                                            <Badge variant={
                                                                insight.confidence === 'High' ? 'default' :
                                                                    insight.confidence === 'Medium' ? 'secondary' : 'outline'
                                                            } className="text-xs">
                                                                {insight.confidence || 'Medium'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {insight.impact || insight.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {analysisResult.recommendedVisualizations && analysisResult.recommendedVisualizations.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Recommended Visualizations</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {analysisResult.recommendedVisualizations.map((viz: any, i: number) => (
                                                    <div key={i} className="p-4 bg-muted/50 rounded-lg border flex flex-col">
                                                        <div className="font-semibold mb-1">{viz.title}</div>
                                                        <p className="text-xs text-muted-foreground mb-3 flex-1">{viz.description}</p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full mt-auto"
                                                            onClick={() => handleRunAgent('viz')}
                                                        >
                                                            <BarChart className="w-3 h-3 mr-2" />
                                                            Generate Chart
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Generated Charts Section - Actual Rendered Charts */}
                                {analysisResult.generatedCharts && analysisResult.generatedCharts.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Generated Charts</h3>
                                        <p className="text-sm text-muted-foreground">Auto-generated visualizations based on data analysis</p>
                                        {analysisResult.generatedCharts.map((chart: any, i: number) => (
                                            <ChartRenderer key={i} chart={chart} />
                                        ))}
                                    </div>
                                )}

                                {analysisResult.pythonCode && (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle className="text-lg">Generated Python Code</CardTitle>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={async () => {
                                                    alert('Code execution coming soon! This will run the code in a secure sandbox.');
                                                }}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Execute Code
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                                                <code>{analysisResult.pythonCode}</code>
                                            </pre>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Scribe Result */}
                                {(analysisResult.executiveSummary || analysisResult.reportContent) && (
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className="text-lg">Executive Summary</CardTitle>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            const { downloadMarkdown } = await import('@/lib/download-utils');
                                                            downloadMarkdown(analysisResult);
                                                        }}
                                                    >
                                                        <FileText className="w-4 h-4 mr-1" />
                                                        MD
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            const { downloadJSON } = await import('@/lib/download-utils');
                                                            downloadJSON(analysisResult);
                                                        }}
                                                    >
                                                        <Database className="w-4 h-4 mr-1" />
                                                        JSON
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                            const { downloadPDF } = await import('@/lib/download-utils');
                                                            await downloadPDF(analysisResult);
                                                        }}
                                                    >
                                                        <Zap className="w-4 h-4 mr-1" />
                                                        PDF
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="whitespace-pre-wrap">{analysisResult.executiveSummary}</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {analysisResult.reportContent?.sections && analysisResult.reportContent.sections.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{analysisResult.reportContent.title || "Detailed Analysis"}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {analysisResult.reportContent.sections.map((section: any, i: number) => (
                                                        <div key={i} className="border-l-4 border-primary/30 pl-4">
                                                            <h3 className="font-semibold text-md mb-2">{section.heading}</h3>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {analysisResult.reportContent?.recommendations && analysisResult.reportContent.recommendations.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Recommendations</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {analysisResult.reportContent.recommendations.map((rec: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm">{rec}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {analysisResult.reportContent?.nextSteps && analysisResult.reportContent.nextSteps.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Next Steps</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ol className="space-y-2 list-decimal list-inside">
                                                        {analysisResult.reportContent.nextSteps.map((step: string, i: number) => (
                                                            <li key={i} className="text-sm">{step}</li>
                                                        ))}
                                                    </ol>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Generated Charts in Scribe */}
                                        {analysisResult.generatedCharts && analysisResult.generatedCharts.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold">Visualizations</h3>
                                                <p className="text-sm text-muted-foreground">Charts generated from the analysis</p>
                                                {analysisResult.generatedCharts.map((chart: any, i: number) => (
                                                    <ChartRenderer key={i} chart={chart} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fallback for other data */}
                                {!analysisResult.summary && !analysisResult.executiveSummary && !analysisResult.reportContent && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm text-muted-foreground">Raw Output</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                                                {JSON.stringify(analysisResult, null, 2)}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {!analysisResult && !thinkingSteps && (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                                <p>Select a session from history or run the agent to see results.</p>
                            </div>
                        )}
                    </div>
                </div >
            </div >
        );
    }

    // Render Grid View
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">AI Agents</h2>
                <Input
                    placeholder="Search agents..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map(agent => {
                    const IconComponent = AGENT_ICONS[agent.icon] || Sparkles;
                    return (
                        <Card
                            key={agent.id}
                            className="hover:shadow-lg transition-shadow cursor-pointer group"
                            onClick={() => setSelectedAgentId(agent.id)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform relative overflow-hidden shadow-md"
                                            style={{
                                                background: `linear-gradient(135deg, ${agent.color}25, ${agent.color}45)`,
                                                border: `2px solid ${agent.color}35`
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                            {agent.avatar ? (
                                                <img
                                                    src={agent.avatar}
                                                    alt={agent.displayName}
                                                    className="w-full h-full object-cover relative z-10"
                                                />
                                            ) : (
                                                <IconComponent
                                                    className="w-7 h-7 relative z-10"
                                                    style={{ color: agent.color }}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {agent.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {agent.fullDescription}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <Badge
                                        variant="outline"
                                        style={{
                                            backgroundColor: `${agent.color}10`,
                                            borderColor: agent.color,
                                            color: agent.color
                                        }}
                                    >
                                        {agent.autonomy} autonomy
                                    </Badge>
                                    {agent.canExecuteCode && (
                                        <Badge variant="outline">
                                            <Zap className="w-3 h-3 mr-1" />
                                            Code Execution
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">
                                        Capabilities:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {agent.capabilities.slice(0, 4).map((cap, i) => (
                                            <span
                                                key={i}
                                                className="text-xs px-2 py-1 bg-muted rounded-md"
                                            >
                                                {cap}
                                            </span>
                                        ))}
                                        {agent.capabilities.length > 4 && (
                                            <span className="text-xs px-2 py-1 text-muted-foreground">
                                                +{agent.capabilities.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {agent.estimatedTime}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card className="bg-muted/30">
                <CardHeader>
                    <CardTitle className="text-lg">How to Use Agents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <div>
                            <div className="font-medium text-sm">Type @ in Chat</div>
                            <div className="text-xs text-muted-foreground">
                                Start typing @ in the chat input to see available agents
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <div>
                            <div className="font-medium text-sm">Select an Agent</div>
                            <div className="text-xs text-muted-foreground">
                                Choose from @Athena, @Scribe, @DataClean, @Viz, or @SQL
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">3</span>
                        </div>
                        <div>
                            <div className="font-medium text-sm">Add Your Request</div>
                            <div className="text-xs text-muted-foreground">
                                Example: "@Athena analyze sales trends" or "@Scribe create a report"
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">4</span>
                        </div>
                        <div>
                            <div className="font-medium text-sm">View Results</div>
                            <div className="text-xs text-muted-foreground">
                                See detailed analysis, charts, and reports right here in the Agents tab
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

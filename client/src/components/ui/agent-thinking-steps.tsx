import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Zap, Brain, Database, BarChart3, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ThinkingStep {
    step: number;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    duration?: number;
    details?: string;
    timestamp: Date;
    agentName?: string;
}

interface AgentThinkingStepsProps {
    steps: ThinkingStep[];
    currentAgent?: string;
}

const agentIcons: Record<string, any> = {
    'athena': Brain,
    'scribe': FileText,
    'viz': BarChart3,
    'sql': Database,
    'dataclean': Zap,
};

const agentColors: Record<string, string> = {
    'athena': 'text-purple-600',
    'scribe': 'text-blue-600',
    'viz': 'text-green-600',
    'sql': 'text-orange-600',
    'dataclean': 'text-pink-600',
};

export function EnhancedAgentThinkingSteps({ steps, currentAgent }: AgentThinkingStepsProps) {
    const [sortedSteps, setSortedSteps] = useState<ThinkingStep[]>([]);
    const [activeStep, setActiveStep] = useState<ThinkingStep | null>(null);
    const [completedSteps, setCompletedSteps] = useState<ThinkingStep[]>([]);

    useEffect(() => {
        const sorted = [...steps].sort((a, b) => a.step - b.step);
        setSortedSteps(sorted);

        // Find the currently active step
        const inProgress = sorted.find(s => s.status === 'in_progress');
        const lastCompleted = [...sorted].reverse().find(s => s.status === 'completed');

        // If everything is completed, show the last one as active (completed state)
        // If nothing is in progress but some are pending, show the first pending? 
        // Usually there's always one in progress or all completed.

        if (inProgress) {
            setActiveStep(inProgress);
        } else if (sorted.every(s => s.status === 'completed') && sorted.length > 0) {
            setActiveStep(sorted[sorted.length - 1]);
        } else if (lastCompleted) {
            setActiveStep(lastCompleted);
        } else if (sorted.length > 0) {
            setActiveStep(sorted[0]);
        }

        setCompletedSteps(sorted.filter(s => s.status === 'completed'));
    }, [steps]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'failed':
                return <XCircle className="w-6 h-6 text-red-500" />;
            case 'in_progress':
                return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
            default:
                return <Clock className="w-6 h-6 text-gray-300" />;
        }
    };

    const getAgentIcon = (agentName?: string) => {
        if (!agentName) return null;
        const Icon = agentIcons[agentName.toLowerCase()];
        if (!Icon) return null;
        const colorClass = agentColors[agentName.toLowerCase()] || 'text-gray-600';
        return <Icon className={`w-5 h-5 ${colorClass}`} />;
    };

    if (!activeStep) return null;

    return (
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-muted/50 overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/20">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeStep.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${activeStep.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        </div>
                        <span>Agent Activity</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {completedSteps.length} / {sortedSteps.length} Steps
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {/* Active Step Focus View */}
                <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500">

                    {/* Icon Ring */}
                    <div className={`relative p-4 rounded-full bg-background border-4 ${activeStep.status === 'in_progress' ? 'border-blue-100 dark:border-blue-900' :
                        activeStep.status === 'completed' ? 'border-green-100 dark:border-green-900' : 'border-gray-100'
                        }`}>
                        {getStatusIcon(activeStep.status)}
                        {activeStep.status === 'in_progress' && (
                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>

                    {/* Step Title */}
                    <div className="space-y-1">
                        <Badge variant="outline" className="mb-2">
                            Step {activeStep.step}
                        </Badge>
                        <h3 className="text-lg font-semibold tracking-tight">
                            {activeStep.description}
                        </h3>
                        {activeStep.agentName && (
                            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-1">
                                {getAgentIcon(activeStep.agentName)}
                                <span>{activeStep.agentName}</span>
                            </div>
                        )}
                    </div>

                    {/* Details / Logs */}
                    {activeStep.details && (
                        <div className="w-full bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground font-mono">
                            {activeStep.details}
                        </div>
                    )}

                    {/* Progress Bar for Active Step */}
                    {activeStep.status === 'in_progress' && (
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-blue-500 animate-progress-bar"></div>
                        </div>
                    )}

                    {/* Completion Time */}
                    {activeStep.status === 'completed' && activeStep.duration && (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Completed in {activeStep.duration.toFixed(2)}s</span>
                        </div>
                    )}
                </div>

                {/* Previous Steps (Faded) */}
                {completedSteps.length > 0 && activeStep.status === 'in_progress' && (
                    <div className="mt-6 pt-4 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Previously completed:</p>
                        <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                            {completedSteps.slice(-2).map(step => (
                                <div key={step.step} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    <span className="truncate">{step.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>


        </Card>
    );
}

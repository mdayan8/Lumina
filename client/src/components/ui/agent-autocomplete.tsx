import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { getAllAgents } from '@shared/agent-registry';
import { Sparkles, FileText, Database, BarChart, Zap, Brain, Droplets } from 'lucide-react';

interface AgentAutocompleteProps {
    inputValue: string;
    cursorPosition: number;
    onSelectAgent: (agentName: string) => void;
    isVisible: boolean;
}

const AGENT_ICONS: Record<string, any> = {
    Brain,
    Sparkles,
    FileText,
    Database,
    BarChart,
    Droplets,
    Zap
};

export function AgentAutocomplete({ inputValue, cursorPosition, onSelectAgent, isVisible }: AgentAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get the text before cursor to check for @ mention
    const textBeforeCursor = inputValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const searchTerm = lastAtIndex >= 0 ? textBeforeCursor.slice(lastAtIndex + 1).toLowerCase() : '';

    useEffect(() => {
        if (!isVisible) {
            setFilteredAgents([]);
            return;
        }

        const agents = getAllAgents();
        const filtered = agents.filter(agent =>
            agent.name.toLowerCase().startsWith(searchTerm) ||
            agent.description.toLowerCase().includes(searchTerm)
        );

        setFilteredAgents(filtered);
        setSelectedIndex(0);
    }, [searchTerm, isVisible]);

    useEffect(() => {
        // Handle keyboard navigation
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible || filteredAgents.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % filteredAgents.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filteredAgents.length) % filteredAgents.length);
                    break;
                case 'Enter':
                case 'Tab':
                    if (filteredAgents[selectedIndex]) {
                        e.preventDefault();
                        onSelectAgent(filteredAgents[selectedIndex].name);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Parent component should handle hiding
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, filteredAgents, selectedIndex, onSelectAgent]);

    if (!isVisible || filteredAgents.length === 0) {
        return null;
    }

    return (
        <Card
            ref={containerRef}
            className="absolute bottom-full left-0 mb-2 w-96 max-h-80 overflow-y-auto shadow-lg border-2 border-primary/20 z-50"
        >
            <div className="p-2">
                <div className="text-xs text-muted-foreground px-3 py-2 font-semibold">
                    Available Agents
                </div>
                {filteredAgents.map((agent, index) => {
                    const IconComponent = AGENT_ICONS[agent.icon] || Sparkles;
                    const isSelected = index === selectedIndex;

                    return (
                        <button
                            key={agent.id}
                            onClick={() => onSelectAgent(agent.name)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${isSelected
                                ? 'bg-primary/10 border-l-2 border-primary'
                                : 'hover:bg-muted'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(135deg, ${agent.color}20, ${agent.color}35)`,
                                        border: `1.5px solid ${agent.color}25`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                    {agent.avatar ? (
                                        <img
                                            src={agent.avatar}
                                            alt={agent.name}
                                            className="w-full h-full object-cover relative z-10"
                                        />
                                    ) : (
                                        <IconComponent
                                            className="w-5 h-5 relative z-10"
                                            style={{ color: agent.color }}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{agent.name}</span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                backgroundColor: `${agent.color}15`,
                                                color: agent.color
                                            }}
                                        >
                                            {agent.autonomy}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {agent.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {agent.capabilities.slice(0, 3).map((cap: string, i: number) => (
                                            <span
                                                key={i}
                                                className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                                            >
                                                {cap}
                                            </span>
                                        ))}
                                        {agent.capabilities.length > 3 && (
                                            <span className="text-xs text-muted-foreground">
                                                +{agent.capabilities.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                <div className="flex items-center justify-between">
                    <span>↑↓ Navigate • Enter/Tab Select • Esc Close</span>
                    <span className="text-primary font-medium">{filteredAgents.length} agents</span>
                </div>
            </div>
        </Card>
    );
}

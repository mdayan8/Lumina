// Agent Registry - Defines all available agents and their capabilities

export const AGENTS = {
    Athena: {
        id: 'athena',
        name: 'Athena',
        displayName: '@Athena',
        description: 'Senior Data Analyst',
        fullDescription: 'Goddess of wisdom and strategy. Performs comprehensive data analysis, generates insights, detects patterns, and creates visualizations with unmatched intelligence.',
        icon: 'Brain',
        avatar: '/avatars/athena.png',
        color: '#9333ea', // purple
        capabilities: [
            'Exploratory Data Analysis (EDA)',
            'Statistical Analysis',
            'Pattern Detection',
            'Anomaly Detection',
            'Insight Generation',
            'Visualization Recommendations',
            'Python Code Generation'
        ],
        autonomy: 'high',
        canExecuteCode: true,
        estimatedTime: '30-60 seconds'
    },
    Scribe: {
        id: 'scribe',
        name: 'Scribe',
        displayName: '@Scribe',
        description: 'Report & Documentation Expert',
        fullDescription: 'Master of writing and knowledge (Thoth-inspired). Creates executive summaries, technical reports, and presentation slides with exceptional clarity and structure.',
        icon: 'FileText',
        avatar: '/avatars/scribe.png',
        color: '#2563eb', // blue
        capabilities: [
            'Executive Summaries',
            'Technical Reports',
            'Presentation Slides',
            'Documentation',
            'Export to PDF/DOCX'
        ],
        autonomy: 'medium',
        canExecuteCode: false,
        estimatedTime: '20-40 seconds'
    },
    Aegis: {
        id: 'aegis',
        name: 'Aegis',
        displayName: '@Aegis',
        description: 'Data Cleaning & Protection',
        fullDescription: 'Shield of protection and purification. Analyzes data quality, detects issues, and provides cleaning recommendations to safeguard your data integrity.',
        icon: 'Droplets',
        avatar: '/avatars/aegis.png',
        color: '#059669', // green
        capabilities: [
            'Quality Analysis',
            'Missing Value Detection',
            'Duplicate Detection',
            'Outlier Detection',
            'Data Type Validation',
            'Cleaning Recommendations',
            'Auto-fix Capabilities'
        ],
        autonomy: 'high',
        canExecuteCode: true,
        estimatedTime: '10-20 seconds'
    },
    Helios: {
        id: 'helios',
        name: 'Helios',
        displayName: '@Helios',
        description: 'Visualization Specialist',
        fullDescription: 'God of the sun, bringing data to light. Illuminates insights through optimal chart types, interactive visualizations, and stunning dashboards.',
        icon: 'BarChart',
        avatar: '/avatars/helios.png',
        color: '#dc2626', // red
        capabilities: [
            'Chart Type Recommendations',
            'Interactive Visualizations',
            'Dashboard Design',
            'Color Scheme Optimization',
            'Data Storytelling',
            'Export Capabilities'
        ],
        autonomy: 'medium',
        canExecuteCode: true,
        estimatedTime: '15-30 seconds'
    },
    Hermes: {
        id: 'hermes',
        name: 'Hermes',
        displayName: '@Hermes',
        description: 'SQL & Query Messenger',
        fullDescription: 'Swift messenger god, delivering information between you and your database. Converts natural language to SQL with speed and precision.',
        icon: 'Database',
        avatar: '/avatars/hermes.png',
        color: '#ea580c', // orange
        capabilities: [
            'Natural Language to SQL',
            'Query Optimization',
            'Schema Analysis',
            'Query Explanation',
            'Performance Tuning',
            'Best Practices'
        ],
        autonomy: 'medium',
        canExecuteCode: false,
        estimatedTime: '10-20 seconds'
    }
} as const;

export type AgentId = keyof typeof AGENTS;

export interface ThinkingStep {
    step: number;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    duration?: number; // in seconds
    details?: string;
    timestamp: Date;
}

export interface AgentMessage {
    id: string;
    role: 'agent';
    agentId: AgentId;
    agentName: string;
    content: string;
    thinkingSteps: ThinkingStep[];
    results?: any;
    error?: string;
    timestamp: Date;
    sessionId?: string;
}

export interface AgentSession {
    id: string;
    agentId: AgentId;
    userId: string;
    fileId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    thinkingSteps: ThinkingStep[];
    results?: any;
    error?: string;
    createdAt: Date;
    completedAt?: Date;
}

// Helper function to get agent by mention
export function getAgentByMention(mention: string): typeof AGENTS[AgentId] | null {
    const normalized = mention.toLowerCase().replace('@', '');
    const agent = Object.values(AGENTS).find(
        a => a.id === normalized || a.name.toLowerCase() === normalized
    );
    return agent || null;
}

// Helper function to detect @ mentions in text
export function detectAgentMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        const agentName = match[1];
        if (getAgentByMention(agentName)) {
            mentions.push(agentName);
        }
    }

    return mentions;
}

// Get all agent IDs
export function getAllAgentIds(): AgentId[] {
    return Object.keys(AGENTS) as AgentId[];
}

// Get all agents as array
export function getAllAgents() {
    return Object.values(AGENTS);
}

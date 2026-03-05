import React from 'react';

/**
 * Proctoring Summary Component
 * Displays proctoring risk assessment in recruiter's candidate scores view
 * 
 * Props:
 * - riskScore: number (0-100)
 * - riskLevel: string ('Low', 'Medium', 'High')
 * - reason: string (explanation from LLM)
 * - detailed: boolean (show detailed view with expand/collapse)
 */
const ProctoringSummary = ({
    riskScore,
    riskLevel,
    reason,
    detailed = false
}) => {
    const [expanded, setExpanded] = React.useState(false);

    // If no proctoring data, don't render
    if (riskScore === null || riskScore === undefined) {
        return (
            <div className="glass-card p-4">
                <p className="text-sm text-muted-foreground">
                    No proctoring data available for this candidate.
                </p>
            </div>
        );
    }

    // Determine color scheme based on risk level
    const getRiskColor = () => {
        switch (riskLevel) {
            case 'Low':
                return {
                    bg: 'bg-success/5',
                    border: 'border-success/20',
                    text: 'text-success',
                    badge: 'bg-success/10 text-success border border-success/30',
                    icon: '✓'
                };
            case 'Medium':
                return {
                    bg: 'bg-warning/5',
                    border: 'border-warning/20',
                    text: 'text-warning',
                    badge: 'bg-warning/10 text-warning border border-warning/30',
                    icon: '⚠'
                };
            case 'High':
                return {
                    bg: 'bg-destructive/5',
                    border: 'border-destructive/20',
                    text: 'text-destructive',
                    badge: 'bg-destructive/10 text-destructive border border-destructive/30',
                    icon: '⚠'
                };
            default:
                return {
                    bg: 'bg-muted/30',
                    border: 'border-border',
                    text: 'text-muted-foreground',
                    badge: 'bg-muted text-muted-foreground border border-border',
                    icon: 'ℹ'
                };
        }
    };

    const colors = getRiskColor();

    // Simple view (for candidate list/cards)
    if (!detailed) {
        return (
            <div className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{colors.icon}</span>
                        <span className="text-sm font-medium text-slate-700">Proctoring Risk:</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${colors.badge}`}>
                            {riskLevel}
                        </span>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>
                        {riskScore}/100
                    </span>
                </div>
            </div>
        );
    }

    // Detailed view (for candidate detail page)
    return (
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-5`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${colors.badge} flex items-center justify-center text-xl`}>
                        {colors.icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground font-heading">Proctoring Assessment</h3>
                        <p className="text-sm text-muted-foreground">AI-based exam integrity analysis</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
                        {riskLevel} Risk
                    </div>
                    <p className={`text-2xl font-bold ${colors.text} mt-1`}>
                        {riskScore}<span className="text-sm font-normal">/100</span>
                    </p>
                </div>
            </div>

            {/* Risk Score Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Risk Score</span>
                    <span>{riskScore}%</span>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${riskLevel === 'Low' ? 'bg-success' :
                                riskLevel === 'Medium' ? 'bg-warning' :
                                    'bg-destructive'
                            }`}
                        style={{ width: `${riskScore}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Low (0-39)</span>
                    <span>Medium (40-69)</span>
                    <span>High (70-100)</span>
                </div>
            </div>

            {/* Reason/Explanation */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">Assessment Details</h4>
                    {reason && reason.length > 150 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-primary hover:text-primary/80 font-medium"
                        >
                            {expanded ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                </div>
                <p className={`text-sm text-muted-foreground ${!expanded && reason && reason.length > 150 ? 'line-clamp-3' : ''}`}>
                    {reason || 'No detailed assessment available.'}
                </p>
            </div>

            {/* Info Footer */}
            <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> This assessment is based on AI analysis of behavioral patterns during the exam.
                    It should be used as one factor among many in your evaluation process.
                </p>
            </div>
        </div>
    );
};

export default ProctoringSummary;

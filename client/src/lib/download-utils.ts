// Utility functions for downloading reports in different formats

export function downloadMarkdown(analysisResult: any) {
    try {
        let markdown = `# ${analysisResult.reportContent?.title || 'Analysis Report'}\n\n`;
        markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
        markdown += `---\n\n`;
        markdown += `## Executive Summary\n\n${analysisResult.executiveSummary || 'No summary available'}\n\n`;

        if (analysisResult.reportContent?.sections) {
            analysisResult.reportContent.sections.forEach((section: any) => {
                markdown += `## ${section.heading}\n\n${section.content}\n\n`;
            });
        }

        if (analysisResult.reportContent?.recommendations?.length > 0) {
            markdown += `## Recommendations\n\n`;
            analysisResult.reportContent.recommendations.forEach((rec: string, i: number) => {
                markdown += `${i + 1}. ${rec}\n`;
            });
            markdown += `\n`;
        }

        if (analysisResult.reportContent?.nextSteps?.length > 0) {
            markdown += `## Next Steps\n\n`;
            analysisResult.reportContent.nextSteps.forEach((step: string, i: number) => {
                markdown += `${i + 1}. ${step}\n`;
            });
        }

        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analysis-report-${new Date().toISOString().split('T')[0]}.md`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('✅ Markdown downloaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Markdown download failed:', error);
        alert('Failed to download Markdown file. Please try again.');
        return false;
    }
}

export function downloadJSON(analysisResult: any) {
    try {
        const jsonString = JSON.stringify(analysisResult, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analysis-report-${new Date().toISOString().split('T')[0]}.json`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('✅ JSON downloaded successfully');
        return true;
    } catch (error) {
        console.error('❌ JSON download failed:', error);
        alert('Failed to download JSON file. Please try again.');
        return false;
    }
}

export async function downloadPDF(analysisResult: any) {
    try {
        console.log('Starting PDF generation...');

        // Dynamic import to avoid loading jsPDF until needed
        const { exportScribeReportAsPDF } = await import('./pdf-exporter');
        await exportScribeReportAsPDF(analysisResult);

        console.log('✅ PDF downloaded successfully');
        return true;
    } catch (error) {
        console.error('❌ PDF download failed:', error);
        alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

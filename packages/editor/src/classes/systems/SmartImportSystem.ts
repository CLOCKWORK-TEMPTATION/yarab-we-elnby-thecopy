export class SmartImportSystem {
    constructor() { }

    async refineClassification(lines: string[]): Promise<any[]> {
        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'refineScreenplay',
                    data: { lines },
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            return result.lines || [];

        } catch (error) {
            console.error("AI Refinement failed:", error);
            return []; // فشل الـ AI لا يوقف التطبيق، نعتمد على الـ Regex
        }
    }
}

// Journal Data Source
// Format: { date: "DD.MM.YYYY", anticipation: "Bearish" | "Bullish" | "No Bias", result: "Right" | "Wrong" | "-" }

const journalData = [
    { date: "20.10.2025", anticipation: "Bearish", result: "Right" },
    { date: "21.10.2025", anticipation: "Bearish", result: "Right" },
    { date: "22.10.2025", anticipation: "No Bias", result: "-" },
    { date: "23.10.2025", anticipation: "No Bias", result: "-" },
    { date: "24.10.2025", anticipation: "Bullish", result: "Right" },
    { date: "27.10.2025", anticipation: "Bullish", result: "Right" },
    { date: "28.10.2025", anticipation: "Bullish", result: "Right" },
    { date: "29.10.2025", anticipation: "Bearish", result: "Right" },
    { date: "30.10.2025", anticipation: "Bearish", result: "Right" },
    { date: "31.10.2025", anticipation: "Bearish", result: "Right" },
    { date: "03.11.2025", anticipation: "No Bias", result: "-" },
    { date: "04.11.2025", anticipation: "Bullish", result: "Wrong" },
    { date: "05.11.2025", anticipation: "No Bias", result: "-" },
    { date: "06.11.2025", anticipation: "Bullish", result: "Right" },
    { date: "07.11.2025", anticipation: "Bullish", result: "Right" },
    { date: "10.11.2025", anticipation: "No Bias", result: "-" },
    { date: "11.11.2025", anticipation: "Bearish", result: "Wrong" }
];

// Export for use if using modules, but for simple script tags we just rely on global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = journalData;
}

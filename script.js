document.addEventListener('DOMContentLoaded', () => {
    
    // --- Theme Toggle Logic ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        const body = document.body;
        const iconSpan = themeToggleBtn.querySelector('.icon');
    
        // Check for saved user preference
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            body.setAttribute('data-theme', savedTheme);
            updateIcon(savedTheme);
        }
    
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    
        function updateIcon(theme) {
            if (theme === 'light') {
                iconSpan.textContent = '🌙'; 
                themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
            } else {
                iconSpan.textContent = '☀️'; 
                themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
            }
        }
    }

    // --- Wallet Copy Logic ---
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        const walletText = document.getElementById('wallet-text');
        const feedbackMsg = document.getElementById('copy-feedback');
        const walletContainer = document.getElementById('wallet-container');
    
        function copyToClipboard() {
            const address = walletText.innerText;
            navigator.clipboard.writeText(address).then(() => {
                feedbackMsg.textContent = 'Address copied to clipboard!';
                feedbackMsg.classList.add('show');
                const originalIcon = copyBtn.innerText;
                copyBtn.innerText = '✅';
                setTimeout(() => {
                    feedbackMsg.classList.remove('show');
                    feedbackMsg.textContent = '';
                    copyBtn.innerText = originalIcon;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                feedbackMsg.textContent = 'Failed to copy.';
                feedbackMsg.classList.add('show');
            });
        }
    
        copyBtn.addEventListener('click', copyToClipboard);
        walletContainer.addEventListener('click', (e) => {
            if (e.target !== copyBtn) copyToClipboard();
        });
    }

    loadJournalData();

    async function loadJournalData() {
        try {
            if (typeof XLSX === 'undefined') {
                console.warn('SheetJS (XLSX) library not found.');
                return;
            }

            const arrayBuffer = await fetchJournalXlsx([
                'assets/journal.xlsx',
                'journal.xlsx'
            ]);
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = selectBestWorksheet(workbook);
            const normalizedData = extractJournalRows(worksheet);

            processJournalData(normalizedData);

        } catch (error) {
            console.error('Error loading journal data:', error);
            const proofBody = document.getElementById('journal-proof-body');
            if (proofBody) {
                proofBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No data found or "assets/journal.xlsx" missing.</td></tr>';
            }
            const monthlyBody = document.getElementById('monthly-winrate-body');
            if (monthlyBody) {
                monthlyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No data found or "assets/journal.xlsx" missing.</td></tr>';
            }
            const accuracyCards = document.querySelectorAll('.stat-card h3');
            accuracyCards.forEach(cardH3 => {
                if (cardH3.nextElementSibling && cardH3.nextElementSibling.textContent.includes('Daily Bias Accuracy')) {
                    cardH3.textContent = '—';
                }
            });
        }
    }

    function processJournalData(journalData) {
        let totalCalls = 0;
        let correct = 0;
        let incorrect = 0;
        let noBias = 0;

        const sortedData = [...journalData].map(entry => {
            const anticipationRaw = getValue(entry, ['anticipation']);
            const resultRaw = getValue(entry, ['biasresult', 'result', 'bias']);
            const dateRaw = getValue(entry, ['date']);
            const dayRaw = getValue(entry, ['day']);
            const dateObj = parseDate(dateRaw);
            const dayValue = dayRaw || getDayName(dateObj);
            return {
                anticipation: toCleanString(anticipationRaw),
                result: toCleanString(resultRaw),
                date: dateRaw,
                day: dayValue,
                dateObj
            };
        }).sort((a, b) => b.dateObj - a.dateObj);

        sortedData.forEach(entry => {
            const anticipation = entry.anticipation;
            const result = entry.result;
            const anticipationLower = anticipation.toLowerCase();
            const resultLower = result.toLowerCase();

            if (anticipationLower === 'no bias' || anticipationLower === 'nobias') {
                noBias++;
            } else {
                totalCalls++;
                if (resultLower === 'right') {
                    correct++;
                } else if (resultLower === 'wrong') {
                    incorrect++;
                }
            }
        });

        const winRate = totalCalls > 0 ? Math.round((correct / totalCalls) * 100) : 0;

        const proofTotalEl = document.getElementById('proof-total');
        const proofCorrectEl = document.getElementById('proof-correct');
        const proofWrongEl = document.getElementById('proof-wrong');
        const proofNoBiasEl = document.getElementById('proof-nobias');
        const proofWinrateEl = document.getElementById('proof-winrate');

        if (proofTotalEl) proofTotalEl.textContent = totalCalls;
        if (proofCorrectEl) proofCorrectEl.textContent = correct;
        if (proofWrongEl) proofWrongEl.textContent = incorrect;
        if (proofNoBiasEl) proofNoBiasEl.textContent = noBias;
        if (proofWinrateEl) proofWinrateEl.textContent = `${winRate}%`;

        const proofBody = document.getElementById('journal-proof-body');
        if (proofBody) {
            proofBody.innerHTML = '';
            sortedData.forEach(entry => {
                const anticipationLower = entry.anticipation.toLowerCase();
                const resultLower = entry.result.toLowerCase();
                const antClass = anticipationLower === 'bullish'
                    ? 'pill pill-bullish'
                    : anticipationLower === 'bearish'
                    ? 'pill pill-bearish'
                    : 'pill pill-neutral';
                const resClass = resultLower === 'right'
                    ? 'pill pill-right'
                    : resultLower === 'wrong'
                    ? 'pill pill-wrong'
                    : 'pill pill-neutral';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.day || '-'}</td>
                    <td>${entry.date || '-'}</td>
                    <td><span class="${antClass}">${entry.anticipation || '-'}</span></td>
                    <td><span class="${resClass}">${entry.result || '-'}</span></td>
                `;
                proofBody.appendChild(row);
            });
        }

        const monthlyBody = document.getElementById('monthly-winrate-body');
        if (monthlyBody) {
            const monthlyStats = buildMonthlyStats(sortedData);
            monthlyBody.innerHTML = '';
            if (monthlyStats.length === 0) {
                monthlyBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No monthly data yet.</td></tr>';
            } else {
                monthlyStats.forEach(stat => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${stat.label}</td>
                        <td>${stat.total}</td>
                        <td>${stat.correct}</td>
                        <td>${stat.wrong}</td>
                        <td>${stat.winrate}%</td>
                    `;
                    monthlyBody.appendChild(row);
                });
            }
        }

        const accuracyCards = document.querySelectorAll('.stat-card h3');
        accuracyCards.forEach(cardH3 => {
            if (cardH3.nextElementSibling && cardH3.nextElementSibling.textContent.includes('Daily Bias Accuracy')) {
                cardH3.textContent = `${winRate}%`;
            }
        });
    }

    function extractJournalRows(worksheet) {
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!rows || rows.length === 0) return [];

        let headerRowIndex = -1;
        let headerMap = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const normalizedRow = row.map(cell => normalizeKey(cell));
            const hasDate = normalizedRow.includes('date');
            const hasAnticipation = normalizedRow.includes('anticipation');
            const hasResult = normalizedRow.includes('biasresult') || normalizedRow.includes('bias') || normalizedRow.includes('result');
            if (hasDate && hasAnticipation && hasResult) {
                headerRowIndex = i;
                headerMap = normalizedRow;
                break;
            }
        }

        if (headerRowIndex === -1) {
            const fallbackData = XLSX.utils.sheet_to_json(worksheet);
            return fallbackData.map(row => {
                const newRow = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = normalizeKey(key);
                    if (normalizedKey) {
                        newRow[normalizedKey] = row[key];
                    }
                });
                return newRow;
            });
        }

        const dataRows = [];
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            const rowObj = {};
            let hasValue = false;
            for (let c = 0; c < headerMap.length; c++) {
                const key = headerMap[c];
                if (!key) continue;
                const value = row[c];
                if (value !== '' && value !== null && value !== undefined) {
                    hasValue = true;
                }
                rowObj[key] = value;
            }
            if (hasValue) {
                dataRows.push(rowObj);
            }
        }
        return dataRows;
    }

    async function fetchJournalXlsx(urls) {
        const tried = [];
        for (const baseUrl of urls) {
            const url = `${baseUrl}?v=${Date.now()}`;
            tried.push(baseUrl);
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
                return await res.arrayBuffer();
            }
        }
        throw new Error(`Failed to fetch journal.xlsx. Tried: ${tried.join(', ')}`);
    }

    function selectBestWorksheet(workbook) {
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Workbook has no sheets.');
        }
        for (const name of workbook.SheetNames) {
            const ws = workbook.Sheets[name];
            const rows = extractJournalRows(ws);
            if (rows && rows.length) return ws;
        }
        return workbook.Sheets[workbook.SheetNames[0]];
    }

    function normalizeKey(key) {
        return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function getValue(entry, keys) {
        for (const key of keys) {
            if (entry[key] !== undefined && entry[key] !== null && entry[key] !== '') {
                return entry[key];
            }
        }
        return '';
    }

    function toCleanString(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    function getDayName(dateObj) {
        if (!dateObj || Number.isNaN(dateObj.getTime())) return '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[dateObj.getDay()];
    }

    function buildMonthlyStats(sortedData) {
        const monthMap = new Map();
        sortedData.forEach(entry => {
            if (!entry.dateObj || Number.isNaN(entry.dateObj.getTime())) return;
            const anticipationLower = entry.anticipation.toLowerCase();
            const resultLower = entry.result.toLowerCase();
            if (anticipationLower === 'no bias' || anticipationLower === 'nobias') return;
            if (resultLower !== 'right' && resultLower !== 'wrong') return;

            const year = entry.dateObj.getFullYear();
            const month = entry.dateObj.getMonth();
            const key = `${year}-${month}`;

            if (!monthMap.has(key)) {
                monthMap.set(key, { year, month, total: 0, correct: 0, wrong: 0 });
            }
            const bucket = monthMap.get(key);
            bucket.total += 1;
            if (resultLower === 'right') bucket.correct += 1;
            if (resultLower === 'wrong') bucket.wrong += 1;
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return Array.from(monthMap.values())
            .sort((a, b) => b.year - a.year || b.month - a.month)
            .map(item => {
                const winrate = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
                return {
                    label: `${monthNames[item.month]} ${item.year}`,
                    total: item.total,
                    correct: item.correct,
                    wrong: item.wrong,
                    winrate
                };
            });
    }

    function parseDate(dateStr) {
        if (!dateStr) return new Date(0);
        if (dateStr instanceof Date) return dateStr;
        if (typeof dateStr === 'number') {
            return new Date((dateStr - (25567 + 2))*86400*1000); 
        }
        
        const parts = String(dateStr).split('.');
        if (parts.length === 3) {
             const [day, month, year] = parts;
             return new Date(`${year}-${month}-${day}`);
        }
        return new Date(dateStr);
    }

});

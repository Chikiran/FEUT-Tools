function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function extractSchedule() {
    try {
        const rows = document.querySelectorAll('.assessment_schedule tbody tr');
        if (rows.length === 0) {
            return { error: "Error: No schedule data found." };
        }

        const csvData = [];
        
        const headers = Array.from(document.querySelectorAll('.assessment_schedule thead th'))
            .map(th => th.innerText.trim());
        csvData.push(headers.join(','));

        rows.forEach(row => {
            const cols = row.querySelectorAll('td');
            const rowData = Array.from(cols).map(col => col.innerText.trim());
            if (rowData.length > 0) {
                csvData.push(rowData.join(','));
            }
        });

        const csv = csvData.join('\n');
        downloadCSV(csv, `schedule.csv`); 

        if (csvData.length === 1) { // If only headers, no data
            return { error: "Error: No valid schedule data extracted." };
        }

        chrome.runtime.sendMessage({ action: "scheduleData", data: csvData });

        console.log("Schedule data extracted and sent to popup:", csvData);
        return { status: "completed", data: csvData };
    } catch (error) {
        console.error("Error extracting schedule data:", error);
        return { error: "Error: Failed to extract schedule data." };
    }
}

// Calculate GWA
function calculateGWA() {
    try {
        const table = document.querySelector('.table');
        const rows = table.querySelectorAll('tbody tr');
        let totalUnitsMidterm = 0;
        let totalWeightedMidterm = 0;
        let totalUnitsFinal = 0;
        let totalWeightedFinal = 0;

        rows.forEach(row => {
            if (row.cells && row.cells.length >= 6) {
                const units = parseFloat(row.cells[3].innerText);
                const midtermGrade = parseFloat(row.cells[4].innerText);
                const finalGrade = parseFloat(row.cells[5].innerText);

                if (!isNaN(units) && !isNaN(midtermGrade)) {
                    totalUnitsMidterm += units;
                    totalWeightedMidterm += units * midtermGrade;
                }

                if (!isNaN(units) && !isNaN(finalGrade)) {
                    totalUnitsFinal += units;
                    totalWeightedFinal += units * finalGrade;
                }
            }
        });

        const midtermGWA = (totalWeightedMidterm / totalUnitsMidterm).toFixed(2);
        const finalGWA = (totalWeightedFinal / totalUnitsFinal).toFixed(2);

        // Remove existing GWA row (well if it exists)
        const existingGWARow = table.querySelector('.gwa-row');
        if (existingGWARow) {
            existingGWARow.remove();
        }

        // Create and insert GWA row
        const gwaRow = document.createElement('tr');
        gwaRow.className = 'gwa-row';
        gwaRow.style.backgroundColor = '#f3f4f6';
        gwaRow.style.fontWeight = 'bold';
        gwaRow.innerHTML = `
            <td colspan="3" style="text-align: right; padding: 8px;">General Weighted Average (GWA):</td>
            <td style="text-align: center; padding: 8px;">${totalUnitsMidterm}</td>
            <td style="text-align: center; padding: 8px;">${midtermGWA}</td>
            <td style="text-align: center; padding: 8px;">${finalGWA}</td>
        `;

        const tbody = table.querySelector('tbody');
        const lastContentRow = tbody.lastElementChild;
        tbody.insertBefore(gwaRow, lastContentRow);

        return { midtermGWA, finalGWA };
    } catch (error) {
        console.error('Error calculating GWA:', error);
        return { error: 'Failed to calculate GWA' };
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "extractSchedule") {
            const scheduleData = extractSchedule();
            sendResponse({ status: "completed", scheduleData });
        } 
        else if (request.action === "calculateGWA") {
            const result = calculateGWA();
            sendResponse(result);
        }
        return true;
    }
);

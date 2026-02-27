// 1. Tab Navigation Logic
function switchTab(tabId, event) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if (tabId === 'dashboard') {
        loadDashboardStats();
    }
}

// 2. Dashboard Logic
async function loadDashboardStats() {
    const loadingEl = document.getElementById('dash-loading');
    const contentEl = document.getElementById('dash-content');
    
    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';

    const stats = await fetchDashboardStats();

    if (stats) {
        document.getElementById('stat-total').innerText = stats.total;
        document.getElementById('stat-refunds').innerText = stats.refunds;
        document.getElementById('stat-5k-timed').innerText = stats.timed5k;
        document.getElementById('stat-5k-untimed').innerText = stats.untimed5k;
        document.getElementById('stat-10k-timed').innerText = stats.timed10k;
        document.getElementById('stat-10k-untimed').innerText = stats.untimed10k;
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
    } else {
        loadingEl.innerText = "Error loading data. Please check connection.";
    }
}

// 3. Search Mode Switching & QR Logic
let html5QrcodeScanner = null;

function switchSearchMode(mode, event) {
    // Update Tab Colors
    document.querySelectorAll('.search-tab').forEach(tab => tab.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    const inputGroup = document.getElementById('manual-input-group');
    const qrGroup = document.getElementById('qr-reader-group');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('registration-results');

    // Clear previous results
    resultsContainer.innerHTML = "";

    if (mode === 'qr') {
        inputGroup.style.display = 'none';
        qrGroup.style.display = 'block';
        startQRScanner();
    } else {
        inputGroup.style.display = 'flex';
        qrGroup.style.display = 'none';
        stopQRScanner();
        
        if (mode === 'email') {
            searchInput.placeholder = "Enter Email ID...";
            searchInput.type = "email";
        } else {
            searchInput.placeholder = "Enter Booking ID (e.g. DFCG...)";
            searchInput.type = "text";
        }
        searchInput.value = ""; // Clear input when switching
    }
}

function startQRScanner() {
    if (!html5QrcodeScanner) {
        // Initialize the scanner
        html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader", 
            { fps: 10, qrbox: {width: 250, height: 250} },
            false
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }
}

function stopQRScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
            console.error("Failed to clear scanner. ", error);
        });
        html5QrcodeScanner = null;
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning immediately
    stopQRScanner();
    
    // Switch UI back to manual input visually
    document.getElementById('qr-reader-group').style.display = 'none';
    document.getElementById('manual-input-group').style.display = 'flex';
    
    // Put the scanned text into the search box and trigger search
    const searchInput = document.getElementById('search-input');
    searchInput.value = decodedText;
    
    // Highlight the ID tab
    document.querySelectorAll('.search-tab')[0].classList.add('active');
    document.querySelectorAll('.search-tab')[2].classList.remove('active');

    handleSearch(); // Automatically search!
}

function onScanFailure(error) {
    // Background errors during scanning are normal (e.g. no QR in frame yet). Ignore.
}

// 4. Registration Search & Card Generation
let currentSearchId = ""; 

async function handleSearch() {
    const searchInput = document.getElementById('search-input').value.trim();
    const resultsContainer = document.getElementById('registration-results');

    if (!searchInput) {
        alert("Please enter a valid search query");
        return;
    }

    currentSearchId = searchInput;

    resultsContainer.innerHTML = `
        <div style="text-align: center; color: var(--accent-yellow); font-style: italic; padding: 20px;">
            <div class="loader-spinner"></div>
            Searching database...
        </div>
    `;

    const result = await lookupBooking(searchInput);

    if (!result || !result.found) {
        resultsContainer.innerHTML = `
            <div class="refund-alert" style="background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #fca5a5;">
                Data not found. Please verify the ID or Email.
            </div>
        `;
        return;
    }

    if (result.isRefund) {
        resultsContainer.innerHTML = `
            <div class="refund-alert">
                <h3 style="margin-bottom: 5px;">⚠️ REFUNDED TICKET</h3>
                <p>This booking has been marked for a refund. Do not issue a bib or race kit.</p>
            </div>
        `;
        return;
    }

    let html = `<div class="cards-grid">`;
    let runnerCount = 1;

    result.formats.forEach(f => {
        for (let i = 0; i < f.tickets; i++) {
            const isTimed = f.format.toUpperCase().includes("TIMED") && !f.format.toUpperCase().includes("UNTIMED");
            
            html += `
            <div class="runner-card" data-format="${f.format}">
                <div class="card-header">
                    Runner ${runnerCount}
                    <span class="format-badge">${f.format}</span>
                </div>
                <div class="card-body">
                    <input type="text" class="cyber-input runner-name" placeholder="Full Name" required>
                    <input type="email" class="cyber-input runner-email" placeholder="Email Address">
                    <input type="tel" class="cyber-input runner-contact" placeholder="Contact Number">
                    
                    <div style="display: flex; gap: 10px;">
                        <select class="cyber-input runner-gender" style="flex: 1;">
                            <option value="" disabled selected>Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <input type="date" class="cyber-input runner-dob" style="flex: 1;" title="Date of Birth">
                    </div>
                    
                    ${isTimed 
                        ? `<div style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; padding: 10px; border-radius: 6px; font-size: 0.85rem; color: #93c5fd; text-align: center;">
                             ⏱️ <strong>TIMED RUN:</strong> Please connect with the NovaRace Rep to collect and link your Timing Chip.
                           </div>`
                        : `<input type="text" class="cyber-input runner-bib" placeholder="Assign Bib Number" required>`
                    }
                </div>
            </div>`;
            runnerCount++;
        }
    });

    html += `</div>`;
    
    html += `
        <div style="margin-top: 20px; text-align: center;">
            <button class="cyber-btn" id="save-btn" onclick="saveRunners()" style="width: 100%; max-width: 300px;">
                Save & Issue Bibs
            </button>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

// 5. Save Participant Data
async function saveRunners() {
    const cards = document.querySelectorAll('.runner-card');
    let participants = [];
    let isValid = true;

    cards.forEach(card => {
        const format = card.getAttribute('data-format');
        const name = card.querySelector('.runner-name').value.trim();
        const email = card.querySelector('.runner-email').value.trim();
        const contact = card.querySelector('.runner-contact').value.trim();
        const gender = card.querySelector('.runner-gender').value;
        const dob = card.querySelector('.runner-dob').value;
        
        const bibInput = card.querySelector('.runner-bib');
        let bibNumber = "TIMED-CHIP-PENDING";
        
        if (bibInput) {
            bibNumber = bibInput.value.trim();
            if (!bibNumber) isValid = false; // Require bib for untimed
        }

        if (!name) isValid = false; // Require name

        participants.push({
            bookingId: currentSearchId,
            format: format,
            name: name,
            email: email,
            contact: contact,
            gender: gender || "",
            dob: dob || "",
            bibNumber: bibNumber
        });
    });

    if (!isValid) {
        alert("Please fill in at least the Name and Bib Number for all runners.");
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    const result = await submitParticipants(participants);

    if (result && result.success) {
        document.getElementById('registration-results').innerHTML = `
            <div class="giant-bib-display" style="font-size: 3rem;">
                SUCCESS!
            </div>
            <p style="text-align: center; color: var(--text-muted); margin-top: 10px;">
                Data saved securely to the sheet.
            </p>
        `;
        document.getElementById('search-input').value = ""; 
    } else {
        alert("Failed to save data. Please try again.");
        saveBtn.innerText = "Save & Issue Bibs";
        saveBtn.disabled = false;
    }
}

window.onload = () => {
    loadDashboardStats();
};
// 1. Tab Navigation Logic
function switchTab(tabId, event) {
    document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    if (tabId === 'dashboard') loadDashboardStats();
    stopQRScanner(); 
}

// 2. Dashboard Logic
async function loadDashboardStats() {
    const loadingEl = document.getElementById('dash-loading');
    const contentEl = document.getElementById('dash-content');
    loadingEl.style.display = 'block'; contentEl.style.display = 'none';

    const stats = await fetchDashboardStats();
    if (stats) {
        document.getElementById('stat-total').innerText = stats.total;
        document.getElementById('stat-refunds').innerText = stats.refunds;
        document.getElementById('stat-5k-timed').innerText = stats.timed5k;
        document.getElementById('stat-5k-untimed').innerText = stats.untimed5k;
        document.getElementById('stat-10k-timed').innerText = stats.timed10k;
        document.getElementById('stat-10k-untimed').innerText = stats.untimed10k;
        loadingEl.style.display = 'none'; contentEl.style.display = 'block';
    } else {
        loadingEl.innerText = "Error loading data. Please check connection.";
    }
}

// 3. QR Search Logic
let html5QrcodeScanner = null;
function switchSearchMode(mode, event) {
    document.querySelectorAll('#registration .search-tab').forEach(tab => tab.classList.remove('active'));
    if (event) event.currentTarget.classList.add('active');

    const inputGroup = document.getElementById('manual-input-group');
    const qrGroup = document.getElementById('qr-reader-group');
    const searchInput = document.getElementById('search-input');
    document.getElementById('registration-results').innerHTML = "";

    if (mode === 'qr') {
        inputGroup.style.display = 'none'; qrGroup.style.display = 'block'; startQRScanner();
    } else {
        inputGroup.style.display = 'flex'; qrGroup.style.display = 'none'; stopQRScanner();
        searchInput.placeholder = mode === 'email' ? "Enter Email ID..." : "Enter Booking ID (e.g. DFCG...)";
        searchInput.type = mode === 'email' ? "email" : "text"; searchInput.value = "";
    }
}

function startQRScanner() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
        html5QrcodeScanner.render(decodedText => {
            stopQRScanner();
            document.getElementById('qr-reader-group').style.display = 'none';
            document.getElementById('manual-input-group').style.display = 'flex';
            document.getElementById('search-input').value = decodedText;
            document.querySelectorAll('#registration .search-tab')[0].classList.add('active');
            document.querySelectorAll('#registration .search-tab')[2].classList.remove('active');
            handleSearch();
        }, () => {});
    }
}
function stopQRScanner() { if (html5QrcodeScanner) { html5QrcodeScanner.clear(); html5QrcodeScanner = null; } }

// ==========================================
// 4. ON-SPOT REGISTRATION MODULE
// ==========================================
const PRICES = { "5K: Timed": 499, "5K: Untimed": 399, "10K: Timed": 699, "10K: Untimed": 599 };

function calculatePrice() {
    const format = document.getElementById('os-format').value;
    const tickets = parseInt(document.getElementById('os-tickets').value) || 1;
    if (format && PRICES[format]) {
        const total = PRICES[format] * tickets;
        document.getElementById('os-calculated').value = total;
        // Auto-fill collected unless user already changed it
        if (!document.getElementById('os-collected').dataset.edited) {
            document.getElementById('os-collected').value = total;
        }
    }
}

// Track if user manually edits the collected amount
document.getElementById('os-collected').addEventListener('input', function() { this.dataset.edited = true; });

// Image Compressor
function compressImage(file, callback) {
    if (!file) return callback(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Shrink to 800px width
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality base64 string
        }
    }
}

async function handleOnSpotSubmit() {
    const name = document.getElementById('os-name').value.trim();
    const email = document.getElementById('os-email').value.trim();
    const contact = document.getElementById('os-contact').value.trim();
    const format = document.getElementById('os-format').value;
    const tickets = parseInt(document.getElementById('os-tickets').value) || 1;
    const calc = document.getElementById('os-calculated').value;
    const collected = document.getElementById('os-collected').value;
    const proofFile = document.getElementById('os-proof').files[0];

    if (!name || !email || !contact || !format || !collected) {
        return alert("Please fill all required booking details.");
    }
    if (!proofFile) {
        return alert("Please capture or upload a photo of the payment proof.");
    }

    const btn = document.getElementById('os-confirm-btn');
    btn.innerText = "Uploading & Creating Booking...";
    btn.disabled = true;

    // Compress image then send
    compressImage(proofFile, async (base64Image) => {
        const payload = {
            name: name, email: email, contact: contact, format: format,
            tickets: tickets, calculatedAmount: calc, amountCollected: collected,
            imageB64: base64Image
        };

        const result = await submitOnSpot(payload);

        if (result && result.success) {
            // Hide booking form, show success and generate runner cards!
            document.getElementById('onspot-form-container').style.display = 'none';
            currentSearchId = result.bookingId; // Set the global ID to the newly generated one
            
            // Build the exact same runner cards UI, prefilling the first card
            let html = `
                <div class="refund-alert" style="background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #a7f3d0;">
                    <h3 style="margin-bottom: 5px;">✅ BOOKING CREATED</h3>
                    <p>Booking ID: <strong>${result.bookingId}</strong></p>
                </div>
                <h3 style="margin-top:20px;">Assign Bibs</h3>
                <div class="cards-grid">`;
            
            for (let i = 0; i < tickets; i++) {
                const isTimed = format.toUpperCase().includes("TIMED") && !format.toUpperCase().includes("UNTIMED");
                // Pre-fill the FIRST card only
                const prefillName = i === 0 ? name : "";
                const prefillEmail = i === 0 ? email : "";
                const prefillContact = i === 0 ? contact : "";

                html += `
                <div class="runner-card" data-format="${format}">
                    <div class="card-header">Runner ${i+1} <span class="format-badge">${format}</span></div>
                    <div class="card-body">
                        <input type="text" class="cyber-input runner-name" placeholder="Full Name" value="${prefillName}" required>
                        <input type="email" class="cyber-input runner-email" placeholder="Email Address" value="${prefillEmail}" required>
                        <input type="tel" class="cyber-input runner-contact" placeholder="Contact Number" value="${prefillContact}" required>
                        <div style="display: flex; gap: 10px;">
                            <select class="cyber-input runner-gender" style="flex: 1;" required>
                                <option value="" disabled selected>Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                            </select>
                            <input type="date" class="cyber-input runner-dob" style="flex: 1;" required>
                        </div>
                        ${isTimed ? `<div style="color: #93c5fd; font-size: 0.85rem; text-align: center;">⏱️ TIMED: Connect with NovaRace rep for chip.</div>` : `<input type="text" class="cyber-input runner-bib" placeholder="Assign Bib Number" required>`}
                    </div>
                </div>`;
            }
            html += `</div>
            <div style="margin-top: 20px; text-align: center;">
                <button class="cyber-btn" id="save-btn" onclick="saveRunners('onspot-runner-results')">Save & Issue Bibs</button>
            </div>`;
            
            document.getElementById('onspot-runner-results').innerHTML = html;

        } else {
            // THIS WILL NOW SHOW THE EXACT ERROR FROM GOOGLE
            alert("Failed to create booking: " + (result && result.error ? result.error : "Network Error"));
            btn.innerText = "Confirm Booking";
            btn.disabled = false;
        }
    });
}

// ==========================================
// 5. MAIN REGISTRATION SAVE MODULE
// ==========================================
let currentSearchId = ""; 

async function handleSearch() {
    const searchInput = document.getElementById('search-input').value.trim();
    const resultsContainer = document.getElementById('registration-results');
    if (!searchInput) return alert("Please enter a valid search query");

    resultsContainer.innerHTML = `<div style="text-align: center; color: var(--accent-yellow); padding: 20px;"><div class="loader-spinner"></div>Searching database...</div>`;
    const result = await lookupBooking(searchInput);

    if (!result || !result.found) return resultsContainer.innerHTML = `<div class="refund-alert">Data not found. Verify the ID or Email.</div>`;
    if (result.isRefund) return resultsContainer.innerHTML = `<div class="refund-alert"><h3>⚠️ REFUNDED</h3><p>Do not issue a bib or kit.</p></div>`;

    currentSearchId = result.bookingId; 

    if (result.alreadyRegistered) {
        let html = `<div class="refund-alert" style="background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #a7f3d0;"><h3>✅ ALREADY REGISTERED</h3></div><div class="cards-grid">`;
        result.participants.forEach(p => {
            const isTimedPending = p.bib === "TIMED-CHIP-PENDING";
            html += `
            <div class="runner-card" style="border-color: #10b981;">
                <div class="card-header" style="background: rgba(16, 185, 129, 0.2);">${p.name} <span class="format-badge">${p.format}</span></div>
                <div class="card-body" style="text-align: center;">
                    ${isTimedPending ? `<div style="color: #93c5fd;">⏱️ TIMED RUN: Chip pending at NovaRace.</div>` : `<div class="giant-bib-display" style="color: #10b981; border-color: #10b981;">${p.bib}</div>`}
                </div>
            </div>`;
        });
        html += `</div>`;
        return resultsContainer.innerHTML = html;
    }

    let html = `<div class="cards-grid">`; let runnerCount = 1;
    result.formats.forEach(f => {
        for (let i = 0; i < f.tickets; i++) {
            const isTimed = f.format.toUpperCase().includes("TIMED") && !f.format.toUpperCase().includes("UNTIMED");
            html += `
            <div class="runner-card" data-format="${f.format}">
                <div class="card-header">Runner ${runnerCount} <span class="format-badge">${f.format}</span></div>
                <div class="card-body">
                    <input type="text" class="cyber-input runner-name" placeholder="Full Name" required>
                    <input type="email" class="cyber-input runner-email" placeholder="Email Address" required>
                    <input type="tel" class="cyber-input runner-contact" placeholder="Contact Number" required>
                    <div style="display: flex; gap: 10px;">
                        <select class="cyber-input runner-gender" style="flex: 1;" required>
                            <option value="" disabled selected>Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                        <input type="date" class="cyber-input runner-dob" style="flex: 1;" required>
                    </div>
                    ${isTimed ? `<div style="color: #93c5fd; font-size: 0.85rem; text-align: center;">⏱️ TIMED: Connect with NovaRace rep for timing chip.</div>` : `<input type="text" class="cyber-input runner-bib" placeholder="Assign Bib Number" required>`}
                </div>
            </div>`;
            runnerCount++;
        }
    });
    html += `</div><div style="margin-top: 20px; text-align: center;"><button class="cyber-btn" id="save-btn" onclick="saveRunners('registration-results')">Save & Issue Bibs</button></div>`;
    resultsContainer.innerHTML = html;
}

// Pass the container ID so this function works for both standard and ONSPOT registrations
async function saveRunners(containerId) {
    const cards = document.querySelectorAll(`#${containerId} .runner-card`);
    let participants = []; let isValid = true;

    cards.forEach(card => {
        const bibInput = card.querySelector('.runner-bib');
        let bibNumber = bibInput ? bibInput.value.trim() : "TIMED-CHIP-PENDING";
        
        const p = {
            bookingId: currentSearchId, format: card.getAttribute('data-format'),
            name: card.querySelector('.runner-name').value.trim(), email: card.querySelector('.runner-email').value.trim(),
            contact: card.querySelector('.runner-contact').value.trim(), gender: card.querySelector('.runner-gender').value,
            dob: card.querySelector('.runner-dob').value, bibNumber: bibNumber
        };
        
        if (!p.name || !p.email || !p.contact || !p.gender || !p.dob || (bibInput && !bibNumber)) isValid = false;
        participants.push(p);
    });

    if (!isValid) return alert("Action Required: Please ensure ALL fields are filled out.");

    document.getElementById('save-btn').innerText = "Saving..."; document.getElementById('save-btn').disabled = true;
    const result = await submitParticipants(participants);

    if (result && result.success) {
        document.getElementById(containerId).innerHTML = `<div class="giant-bib-display">SUCCESS!</div><p style="text-align:center;">Data securely saved to all sheets!</p>`;
        
        // Reset flows
        if (containerId === 'registration-results') {
            document.getElementById('search-input').value = ""; 
        } else {
            // Reset OnSpot Form for the next person
            setTimeout(() => {
                document.getElementById('onspot-form-container').style.display = 'block';
                document.getElementById(containerId).innerHTML = "";
                document.getElementById('os-name').value = "";
                document.getElementById('os-email').value = "";
                document.getElementById('os-contact').value = "";
                document.getElementById('os-tickets').value = "1";
                document.getElementById('os-format').value = "";
                document.getElementById('os-calculated').value = "";
                document.getElementById('os-collected').value = "";
                document.getElementById('os-collected').dataset.edited = "";
                document.getElementById('os-proof').value = "";
                document.getElementById('os-confirm-btn').innerText = "Confirm Booking";
                document.getElementById('os-confirm-btn').disabled = false;
            }, 3000); // Wait 3 seconds so they can see "Success!" then refresh the form
        }
    } else {
        alert("Failed to save data. Please try again.");
        document.getElementById('save-btn').innerText = "Save & Issue Bibs"; document.getElementById('save-btn').disabled = false;
    }
}

window.onload = () => loadDashboardStats();
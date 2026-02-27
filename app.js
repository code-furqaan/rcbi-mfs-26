// 1. Tab Navigation Logic
function switchTab(tabId) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show the targeted section
    document.getElementById(tabId).classList.add('active');

    // Highlight the clicked buttons (handles both mobile and desktop menus)
    if (event) {
        event.target.classList.add('active');
    }

    // If Dashboard is clicked, refresh stats
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

    // Calls the function from api.js 
    const stats = await fetchDashboardStats();

    if (stats) {
        // Map data to the specific UI elements
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

// 3. Registration Search (Placeholder for next step)
async function handleSearch() {
    const searchInput = document.getElementById('search-input').value.trim();
    const resultsContainer = document.getElementById('registration-results');

    if (!searchInput) {
        alert("Please enter a Booking ID");
        return;
    }

    resultsContainer.innerHTML = `
        <div style="text-align: center; color: var(--accent-yellow); font-style: italic; padding: 20px;">
            <div class="loader-spinner"></div>
            Searching database...
        </div>
    `;

    // The dynamic runner cards logic will be added here next!
}

// Initialize dashboard on load
window.onload = () => {
    loadDashboardStats();
};
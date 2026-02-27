// dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
    const loader = document.getElementById("dash-loader");
    const statsContainer = document.getElementById("stats-container");
    
    // Elements to update
    const elTotal = document.getElementById("stat-total");
    const el5kTimed = document.getElementById("stat-5k-timed");
    const el5kUntimed = document.getElementById("stat-5k-untimed");
    const el10kTimed = document.getElementById("stat-10k-timed");
    const el10kUntimed = document.getElementById("stat-10k-untimed");

    // Fetch stats from Google Sheets via api.js
    const stats = await fetchDashboardStats();

    // Hide loader and show container
    loader.style.display = "none";
    statsContainer.style.display = "block";

    if (stats) {
        // Update the UI with the fetched numbers
        elTotal.innerText = stats.total;
        el5kTimed.innerText = stats.timed5k;
        el5kUntimed.innerText = stats.untimed5k;
        el10kTimed.innerText = stats.timed10k;
        el10kUntimed.innerText = stats.untimed10k;
    } else {
        // Handle error state
        elTotal.innerText = "Error";
        alert("Could not load dashboard stats. Please check your internet connection or API URL.");
    }
});
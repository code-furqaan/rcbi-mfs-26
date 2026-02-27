// api.js

// Your Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbwgnIwKpA35satYWU1gsa7Jo6836qfinIaIFi92LUTG3SJjjYBzli4obyO7i2DDILwV/exec";

// Function to get dashboard stats
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_URL}?action=getDashboard`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching stats:", error);
        return null;
    }
}

// Function to look up a booking ID
async function lookupBooking(bookingId) {
    try {
        const response = await fetch(`${API_URL}?action=lookup&bookingId=${encodeURIComponent(bookingId)}`);
        return await response.json();
    } catch (error) {
        console.error("Error looking up booking:", error);
        return null;
    }
}

// Function to submit participant data
async function submitParticipants(participantsData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ participants: participantsData })
        });
        return await response.json();
    } catch (error) {
        console.error("Error saving participants:", error);
        return { success: false, error: "Network error" };
    }
}
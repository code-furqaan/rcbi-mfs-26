const API_URL = "https://script.google.com/macros/s/AKfycbwDBOW6vqteTgfTOTQ9uoxITUySQVCn__3sJUEd9cmsALgWrQ_n5TBR1BEO4nMXPju3bg/exec";

async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_URL}?action=getDashboard`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching stats:", error);
        return null;
    }
}

async function lookupBooking(bookingId) {
    try {
        const response = await fetch(`${API_URL}?action=lookup&bookingId=${encodeURIComponent(bookingId)}`);
        return await response.json();
    } catch (error) {
        console.error("Error looking up booking:", error);
        return null;
    }
}

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

// NEW: Send ON-SPOT data & image
async function submitOnSpot(onSpotData) {
    try {
        onSpotData.action = "onspot";
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(onSpotData)
        });
        return await response.json();
    } catch (error) {
        console.error("Error saving onspot:", error);
        return { success: false, error: "Network error" };
    }
}
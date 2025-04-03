const ApiUrl = "https://brianobruno.github.io/cats.json";
let catPhotoUrl = ""; // Store the API cat photo

// Function to fetch data from API (only fetches facts)
async function fetchCatFacts() {
    try {
        const response = await fetch(ApiUrl);
        if (!response.ok) {
            throw new Error(`Network error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("API Data:", data);

        // Store the cat photo URL but do not change the image yet
        catPhotoUrl = data.catPhoto;

        // Populate the table with facts only
        populateTable(data.facts);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Function to populate the table with sorted facts
function populateTable(facts) {
    const tableBody = document.querySelector("#factsTable tbody");
    tableBody.innerHTML = ""; // Clear previous data

    // Sort facts by factId
    facts.sort((a, b) => a.factId - b.factId);

    // Insert facts into table
    facts.forEach(fact => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${fact.factId}</td><td>${fact.text}</td>`;
        tableBody.appendChild(row);
    });
}

// Function to update the image (only when "Change Picture" button is clicked)
function changeCatPhoto() {
    const imgElement = document.getElementById("catimg");

    if (catPhotoUrl) {
        imgElement.src = catPhotoUrl; // Change the image to API cat picture
    } else {
        console.warn("No API image found. Please fetch facts first.");
    }
}

// Event listeners for buttons
document.getElementById("callApiBtn").addEventListener("click", fetchCatFacts);
document.getElementById("PctrCH").addEventListener("click", changeCatPhoto);

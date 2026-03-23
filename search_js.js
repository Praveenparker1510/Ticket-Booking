let allBuses = [];
let currentFilteredBuses = [];

// Fallback bus data (manually included) in case JSON fetch fails.
const fallbackBusData = {
  "Chennai-Bangalore": [
    {"busName":"GreenLine Express","departure":"21:00","arrival":"05:30","price":950,"type":"AC Sleeper"},
    {"busName":"KPN Deluxe","departure":"20:30","arrival":"05:00","price":1050,"type":"AC Sleeper"},
    {"busName":"Parveen Royal","departure":"22:00","arrival":"06:00","price":1100,"type":"Volvo AC"}
  ],
  "Chennai-Goa": [
    {"busName":"Coastal Express","departure":"19:00","arrival":"09:00","price":1600,"type":"AC Sleeper"},
    {"busName":"BeachLine Travels","departure":"20:00","arrival":"10:30","price":1700,"type":"AC Sleeper"}
  ],
  "Chennai-Hyderabad": [
    {"busName":"Telangana Express","departure":"20:00","arrival":"06:00","price":1200,"type":"AC Sleeper"},
    {"busName":"Deccan Rider","departure":"21:00","arrival":"07:00","price":1250,"type":"AC Sleeper"}
  ]
};

function getDuration(departure, arrival) {
  const [dh, dm] = departure.split(":").map(Number);
  const [ah, am] = arrival.split(":").map(Number);
  let start = dh * 60 + dm;
  let end = ah * 60 + am;
  if (end <= start) end += 24 * 60;
  const duration = end - start;
  const h = Math.floor(duration / 60);
  const m = duration % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function formatRoute(route) {
  return route.replace("-", " → ");
}

function setActiveButtons(category, value) {
  const buttons = document.querySelectorAll(`.filters button[data-${category}]`);
  buttons.forEach(button => {
    if (button.dataset[category] === value) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function displayBuses(buses) {
  const container = document.getElementById("bus-list");
  const count = document.getElementById("bus-count");
  container.innerHTML = "";

  if (!buses || buses.length === 0) {
    if (count) count.textContent = "0 buses found";
    container.innerHTML = "<p>No buses found with selected filter or route.</p>";
    return;
  }

  if (count) count.textContent = `${buses.length} buses found`;

  const rupee = "\u20B9"; // ensures proper rupee symbol in UTF-8
  const routeArrow = "\u2192"; // arrow symbol (→) explicitly

  buses.forEach(bus => {
    if (!bus.rating) bus.rating = Number((Math.random() * 1.4 + 3.6).toFixed(1));
    if (!bus.seatsLeft) bus.seatsLeft = Math.floor(Math.random() * 30 + 5);
    if (!bus.duration) bus.duration = getDuration(bus.departure, bus.arrival);

    const card = document.createElement("div");
    card.className = "bus-card";
    card.innerHTML = `
      <div class="bus-left">
        <div class="bus-name">${bus.busName} <span class="bus-type">${bus.type}</span></div>

        <div class="bus-time-row">
          <div class="bus-time-large">${bus.departure}</div>
          <div class="bus-time-colon">${routeArrow}</div>
          <div class="bus-time-large">${bus.arrival}</div>
        </div>

        <div class="bus-duration-pill">${bus.duration}</div>

        <div class="bus-meta">
          <span>Rating: ${Number(bus.rating).toFixed(1)}</span>
          <span style="margin:0 8px;">•</span>
          <span>${bus.seatsLeft} seats left</span>
        </div>
      </div>

      <div class="bus-right">
        <div class="price">${rupee}${bus.price}</div>
        <div class="per-seat">per seat</div>
        <button class="select-btn" type="button">Book</button>
      </div>
    `;

    const selectBtn = card.querySelector(".select-btn");
    if (selectBtn) {
      selectBtn.addEventListener("click", () => {
        const date = document.getElementById("travel-date").value || "";
        const passengers = document.getElementById("passenger-count").value || "1";

        const params = new URLSearchParams({
          busName: bus.busName,
          route: bus.route,
          departure: bus.departure,
          arrival: bus.arrival,
          price: bus.price,
          type: bus.type,
          date: date,
          passengers: passengers
        });

        window.location.href = `seat_selection.html?${params.toString()}`;
      });
    }

    container.appendChild(card);
  });
}

function filterBus(type) {
  setActiveButtons("type", type);
  if (type === "All") {
    currentFilteredBuses = allBuses;
  } else {
    const expected = type.toLowerCase();
    currentFilteredBuses = allBuses.filter(bus => {
      const busType = (bus.type || "").toString().toLowerCase();
      return busType.includes(expected);
    });
  }
  displayBuses(currentFilteredBuses);
}

function sortBuses(criteria) {
  setActiveButtons("sort", criteria);
  if (!currentFilteredBuses || currentFilteredBuses.length === 0) return;

  const sorted = [...currentFilteredBuses];

  if (criteria === "lowest-price") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (criteria === "earliest-departure") {
    const toMinutes = time => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    sorted.sort((a, b) => toMinutes(a.departure) - toMinutes(b.departure));
  } else if (criteria === "highest-rating") {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  currentFilteredBuses = sorted;
  displayBuses(sorted);
}

function updateSearchSummary(dep, arr, date, pass) {
  const fromCell = document.getElementById("sum-from");
  const toCell = document.getElementById("sum-to");
  const passCell = document.getElementById("sum-passengers");
  const dateCell = document.getElementById("sum-date");

  if (fromCell) fromCell.textContent = dep || "-";
  if (toCell) toCell.textContent = arr || "-";
  if (passCell) passCell.textContent = pass || "-";
  if (dateCell) dateCell.textContent = date || "-";

  const panel = document.getElementById("summary-panel");
  if (panel) {
    panel.style.display = "block";
  }
}

function searchRoute() {
  const dep = normalizeCity(document.getElementById("departure-city").value);
  const arr = normalizeCity(document.getElementById("arrival-city").value);
  const date = document.getElementById("travel-date").value;
  const pass = document.getElementById("passenger-count").value || "1";

  if (!dep || !arr) {
    alert("Please enter both departure and arrival cities.");
    return;
  }

  const routeKey = `${dep}-${arr}`;
  const selected = allBuses.filter(bus => bus.route.toLowerCase() === routeKey.toLowerCase());

  currentFilteredBuses = selected;
  displayBuses(selected);
  updateSearchSummary(dep, arr, date, pass);
}

function showAllBuses() {
  const dep = normalizeCity(document.getElementById("departure-city").value);
  const arr = normalizeCity(document.getElementById("arrival-city").value);
  const date = document.getElementById("travel-date").value;
  const pass = document.getElementById("passenger-count").value || "1";

  currentFilteredBuses = allBuses;
  displayBuses(allBuses);
  updateSearchSummary(dep || "Any", arr || "Any", date || "Any", pass);
}

function showBusDetails(bus) {
  const detailArea = document.getElementById("bus-detail-card");
  if (!detailArea) return;

  detailArea.innerHTML = `
    <div class="bus-detail-card">
      <h3>${bus.busName}</h3>
      <p><strong>Route:</strong> ${formatRoute(bus.route)}</p>
      <p><strong>Departure:</strong> ${bus.departure}</p>
      <p><strong>Arrival:</strong> ${bus.arrival}</p>
      <p><strong>Duration:</strong> ${bus.duration}</p>
      <p><strong>Type:</strong> ${bus.type}</p>
      <p><strong>Fare:</strong> ₹${bus.price}</p>
      <p><strong>Rating:</strong> ${bus.rating}</p>
      <p><strong>Seats left:</strong> ${bus.seatsLeft}</p>
      <p><strong>Journey Date:</strong> ${document.getElementById("travel-date").value || "Not selected"}</p>
      <p><strong>Passengers:</strong> ${document.getElementById("passenger-count").value || "1"}</p>
    </div>
  `;
}

function normalizeCity(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getUrlSearchParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    dep: params.get("dep") || "",
    arr: params.get("arr") || "",
    date: params.get("date") || "",
    pass: params.get("pass") || "1"
  };
}

function applyUrlSearchToForm() {
  const { dep, arr, date, pass } = getUrlSearchParams();
  if (!dep || !arr) return;

  const departEl = document.getElementById("departure-city");
  const arrivalEl = document.getElementById("arrival-city");
  const dateEl = document.getElementById("travel-date");
  const passEl = document.getElementById("passenger-count");

  if (departEl) departEl.value = dep;
  if (arrivalEl) arrivalEl.value = arr;
  if (dateEl) dateEl.value = date;
  if (passEl) passEl.value = pass;

  searchRoute();
}

function loadBusData(data) {
  allBuses = [];
  for (let route in data) {
    data[route].forEach(bus => {
      bus.route = route;
      allBuses.push(bus);
    });
  }
  currentFilteredBuses = allBuses;
  displayBuses(allBuses);
  applyUrlSearchToForm();
}

fetch("bus_booking_json.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => loadBusData(data))
  .catch(err => {
    console.warn("JSON file could not be loaded, using fallback data.", err);
    const info = document.getElementById("bus-list");
    if (info) info.innerHTML = `<p style="color:red;">Loaded fallback bus list because JSON fetch failed (${err.message}).</p>`;

    const inlineJson = document.getElementById("bus-data-json");
    if (inlineJson && inlineJson.textContent.trim()) {
      try {
        const parsed = JSON.parse(inlineJson.textContent);
        loadBusData(parsed);
        return;
      } catch (parseError) {
        console.warn("Unable to parse inline JSON fallback:", parseError);
      }
    }

    loadBusData(fallbackBusData);
  });

// Set initial filter/sort active states if available
setActiveButtons("type", "All");
setActiveButtons("sort", "lowest-price");

const searchButton = document.getElementById("search-btn");
if (searchButton) {
  searchButton.addEventListener("click", searchRoute);
}

const showAllButton = document.getElementById("show-all-btn");
if (showAllButton) {
  showAllButton.addEventListener("click", showAllBuses);
}

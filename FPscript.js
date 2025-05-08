// API configuration
const API_CONFIG = {
  baseUrl: "https://imdb236.p.rapidapi.com/imdb",
  headers: {
    "X-RapidAPI-Key": "1f0d9f7e4amshd18fd7af2a9dbd3p15bb14jsn063d788a4693", // API key will be added from environment variables
    "X-RapidAPI-Host": "imdb236.p.rapidapi.com",
  },
}

// State management for pagination
const state = {
  top250: { page: 0, itemsPerPage: 8, data: [] },
  popular: { page: 0, itemsPerPage: 8, data: [] }
}

// DOM elements
const elements = {
  top250: {
    container: document.getElementById("top250-container"),
    prevBtn: document.getElementById("top250-prev"),
    nextBtn: document.getElementById("top250-next"),
  },
  popular: {
    container: document.getElementById("popular-container"),
    prevBtn: document.getElementById("popular-prev"),
    nextBtn: document.getElementById("popular-next"),
  },
  modal: {
    title: document.getElementById("movieModalTitle"),
    body: document.getElementById("movieModalBody"),
    element: null, // Will be initialized after DOM is loaded
  }
}

// Fetch data from API
async function fetchData(endpoint) {
  try {
    // Use environment variable for API key
    API_CONFIG.headers["X-RapidAPI-Key"] = "1f0d9f7e4amshd18fd7af2a9dbd3p15bb14jsn063d788a4693";
    
    const response = await fetch(`${API_CONFIG.baseUrl}/${endpoint}`, {
      method: "GET",
      headers: API_CONFIG.headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    return { error: error.message }
  }
}

// Initialize the application
async function initApp() {
  // Initialize background animation
  initBackgroundAnimation();
  
  // Initialize modal with specific options to fix backdrop issue
  const modalElement = document.getElementById("movieModal");
  const bootstrap = window.bootstrap; // Access bootstrap from the window object
  elements.modal.element = new bootstrap.Modal(modalElement, {
    backdrop: false, // Disable the backdrop completely
    keyboard: true,
    focus: true
  });
  
  // Fetch all data
  const top250Promise = fetchData("top250-movies")
  const popularPromise = fetchData("most-popular-movies")

  // Wait for all promises to resolve
  const [top250Data, popularData] = await Promise.all([top250Promise, popularPromise])

  // Process and display data
  if (!top250Data.error) {
    state.top250.data = top250Data
    renderMovies("top250")
  } else {
    showError("top250", top250Data.error)
  }

  if (!popularData.error) {
    state.popular.data = popularData
    renderMovies("popular")
  } else {
    showError("popular", popularData.error)
  }

  // Set up event listeners for pagination
  setupPaginationListeners()
}

// Initialize background animation
function initBackgroundAnimation() {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'backgroundCanvas';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');

  // Set canvas dimensions
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Create dots
  const dots = [];
  const dotCount = 50;
  const dotColors = ['#3498db', '#2c3e50', '#e74c3c', '#f39c12', '#1abc9c'];

  class Dot {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.color = dotColors[Math.floor(Math.random() * dotColors.length)];
      this.opacity = Math.random() * 0.5 + 0.1;
      this.fadeDirection = Math.random() > 0.5 ? 0.005 : -0.005;
    }

    update() {
      // Move dot
      this.x += this.speedX;
      this.y += this.speedY;

      // Fade in/out effect
      this.opacity += this.fadeDirection;
      if (this.opacity >= 0.6 || this.opacity <= 0.1) {
        this.fadeDirection *= -1;
      }

      // Wrap around edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + Math.floor(this.opacity * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }

  // Initialize dots
  for (let i = 0; i < dotCount; i++) {
    dots.push(new Dot());
  }

  // Animation loop
  function animate() {
    // Clear canvas with semi-transparent background
    ctx.fillStyle = 'rgba(248, 249, 250, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw dots
    dots.forEach(dot => {
      dot.update();
      dot.draw();
    });

    requestAnimationFrame(animate);
  }

  // Start animation
  animate();
}

// Show error message
function showError(section, message) {
  elements[section].container.innerHTML = `
    <div class="col-12">
      <div class="error-message">
        <h4>Error Loading Data</h4>
        <p>${message}</p>
        <p>Please check your API key and try again.</p>
      </div>
    </div>
  `
}

// Render movies for a section
function renderMovies(section) {
  const { data, page, itemsPerPage } = state[section]
  const container = elements[section].container
  const startIndex = page * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const moviesToShow = data.slice(startIndex, endIndex)

  // Clear container
  container.innerHTML = ""

  // If no data or empty array
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="col-12 text-center"><p>No movies found.</p></div>'
    return
  }

  // Create movie cards
  moviesToShow.forEach((movie) => {
    const movieCard = createMovieCard(movie, section)
    container.appendChild(movieCard)
  })

  // Update pagination buttons
  updatePaginationButtons(section)
}

// Create a movie card element
function createMovieCard(movie, section) {
  const col = document.createElement("div")
  col.className = "col-md-6 col-lg-3 mb-4"

  // Extract movie data
  const title = movie.primaryTitle
  const year = movie.startYear
  const image = movie.primaryImage || "/abstract-movie-poster.png"
  const rating = movie.averageRating || "N/A"
  const id = movie.id

  // Create card HTML
  col.innerHTML = `
    <div class="card movie-card" data-movie-id="${id}" data-section="${section}">
      <div class="position-relative">
        <img src="${image}" 
             class="card-img-top movie-poster" 
             alt="${title}">
        <div class="movie-rating">${rating}</div>
      </div>
      <div class="card-body">
        <h5 class="card-title">${title}</h5>
        <p class="movie-year">${year}</p>
        ${movie.description ? `<p class="movie-description">${movie.description}</p>` : ""}
      </div>
    </div>
  `

  // Add click event to show movie details
  col.querySelector(".movie-card").addEventListener("click", () => {
    showMovieDetails(movie, section)
  })

  return col
}

// Show movie details in modal
function showMovieDetails(movie, section) {
  // Set modal title
  elements.modal.title.textContent = movie.primaryTitle

  // Create modal content
  const modalContent = `
    <div class="row">
      <div class="col-md-4">
        <img src="${movie.primaryImage || "/abstract-movie-poster.png"}" 
             class="img-fluid modal-movie-poster" 
             alt="${movie.primaryTitle}">
      </div>
      <div class="col-md-8">
        <h4>${movie.primaryTitle} (${movie.startYear})</h4>
        ${movie.description ? `<p>${movie.description}</p>` : ""}
        <p><strong>Rating:</strong> ${movie.averageRating || "N/A"} (${movie.numVotes ? `${movie.numVotes.toLocaleString()} votes` : "N/A"})</p>
        <p><strong>Runtime:</strong> ${movie.runtimeMinutes ? `${movie.runtimeMinutes} minutes` : "N/A"}</p>
        <div class="mb-3">
          <strong>Genres:</strong>
          ${
            movie.genres
              ? movie.genres
                  .map(genre => `<span class="badge bg-secondary badge-genre">${genre}</span>`)
                  .join("")
              : "N/A"
          }
        </div>
        ${movie.language ? `<p><strong>Language:</strong> ${movie.language}</p>` : ""}
        ${
          movie.countriesOfOrigin
            ? `
            <p><strong>Country:</strong> ${movie.countriesOfOrigin.join(", ")}</p>
          `
            : ""
        }
        <p><a href="${movie.url}" target="_blank" class="btn btn-primary mt-3">View on IMDB</a></p>
      </div>
    </div>
  `

  // Set modal content and show modal
  elements.modal.body.innerHTML = modalContent
  elements.modal.element.show()
}

// Update pagination buttons
function updatePaginationButtons(section) {
  const { data, page, itemsPerPage } = state[section]
  const totalPages = Math.ceil(data.length / itemsPerPage)

  // Update previous button
  elements[section].prevBtn.disabled = page === 0

  // Update next button
  elements[section].nextBtn.disabled = page >= totalPages - 1
}

// Set up pagination event listeners
function setupPaginationListeners() {
  // Top 250 pagination
  elements.top250.prevBtn.addEventListener("click", () => {
    if (state.top250.page > 0) {
      state.top250.page--
      renderMovies("top250")
    }
  })

  elements.top250.nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(state.top250.data.length / state.top250.itemsPerPage)
    if (state.top250.page < totalPages - 1) {
      state.top250.page++
      renderMovies("top250")
    }
  })

  // Popular pagination
  elements.popular.prevBtn.addEventListener("click", () => {
    if (state.popular.page > 0) {
      state.popular.page--
      renderMovies("popular")
    }
  })

  elements.popular.nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(state.popular.data.length / state.popular.itemsPerPage)
    if (state.popular.page < totalPages - 1) {
      state.popular.page++
      renderMovies("popular")
    }
  })

  // Add smooth scrolling for navigation links
  document.querySelectorAll("nav a.nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetElement = document.querySelector(targetId)

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: "smooth"
        })

        // Update active nav link
        document.querySelectorAll("nav a.nav-link").forEach((navLink) => {
          navLink.classList.remove("active")
        })
        this.classList.add("active")
      }
    })
  })
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", initApp)
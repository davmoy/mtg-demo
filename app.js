// ========================================
// BEATING SHAWN - Anti-Oskar Deck Viewer
// Scryfall API Integration
// ========================================

// Deck data organized by category
const deckData = {
    commander: [
        "Grand Arbiter Augustin IV"
    ],
    graveyard_hate: [
        "Rest in Peace",
        "Leyline of the Void",
        "Grafdigger's Cage",
        "Dauthi Voidwalker",
        "Soul-Guide Lantern",
        "Relic of Progenitus",
        "Tormod's Crypt",
        "Containment Priest",
        "Ashiok, Dream Render",
        "Planar Void",
        "Sentinel Totem"
    ],
    anti_cast: [
        "Drannith Magistrate",
        "Void Mirror",
        "Lavinia, Azorius Renegade"
    ],
    anti_wheel: [
        "Narset, Parter of Veils",
        "Notion Thief",
        "Spirit of the Labyrinth",
        "Alms Collector",
        "Smothering Tithe",
        "Consecrated Sphinx"
    ],
    stax: [
        "Winter Orb",
        "Static Orb",
        "Stasis",
        "Trinisphere",
        "Sphere of Resistance",
        "Thorn of Amethyst",
        "Thalia, Guardian of Thraben",
        "Rhystic Study",
        "Mystic Remora",
        "Rule of Law",
        "Arcane Laboratory",
        "Deafening Silence",
        "Esper Sentinel",
        "Propaganda",
        "Ghostly Prison",
        "Aura of Silence",
        "Back to Basics"
    ],
    removal: [
        "Swords to Plowshares",
        "Path to Exile",
        "Cyclonic Rift",
        "Counterspell",
        "Mana Drain",
        "Force of Will",
        "Swan Song",
        "Dovin's Veto",
        "Fierce Guardianship",
        "Flusterstorm",
        "Teferi, Time Raveler",
        "Silence",
        "Grand Abolisher"
    ],
    card_advantage: [
        "The One Ring",
        "Teferi's Puzzle Box",
        "Land Tax",
        "Search for Azcanta",
        "Dig Through Time",
        "Treasure Cruise"
    ],
    ramp: [
        "Sol Ring",
        "Mana Crypt",
        "Mana Vault",
        "Chrome Mox",
        "Mox Diamond",
        "Arcane Signet",
        "Azorius Signet",
        "Talisman of Progress",
        "Fellwar Stone",
        "Mind Stone"
    ],
    win_conditions: [
        "Approach of the Second Sun",
        "Thassa's Oracle",
        "Helm of Obedience",
        "Overwhelming Splendor"
    ],
    lands: [
        "Command Tower",
        "Hallowed Fountain",
        "Tundra",
        "Flooded Strand",
        "Polluted Delta",
        "Misty Rainforest",
        "Prismatic Vista",
        "Ancient Tomb",
        "City of Brass",
        "Mana Confluence",
        "Mystic Gate",
        "Seachrome Coast",
        "Adarkar Wastes",
        "Glacial Fortress",
        "Eiganjo, Seat of the Empire",
        "Otawara, Soaring City",
        "Hall of Heliod's Generosity",
        "Academy Ruins",
        "Bojuka Bog",
        "Scavenger Grounds",
        "Strip Mine",
        "Wasteland",
        "Island",
        "Plains"
    ]
};

// Category display names
const categoryNames = {
    commander: "Commander",
    graveyard_hate: "GY Hate",
    anti_cast: "Anti-Cast",
    anti_wheel: "Anti-Wheel",
    stax: "Stax",
    removal: "Removal",
    card_advantage: "Draw",
    ramp: "Ramp",
    win_conditions: "Win Con",
    lands: "Land"
};

// Card cache to avoid duplicate API calls
const cardCache = new Map();

// ========== SCRYFALL API ==========

async function fetchCard(cardName) {
    // Check cache first
    if (cardCache.has(cardName)) {
        return cardCache.get(cardName);
    }

    try {
        // Use Scryfall's fuzzy search for best results
        const response = await fetch(
            `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`
        );
        
        if (!response.ok) {
            throw new Error(`Card not found: ${cardName}`);
        }

        const card = await response.json();
        cardCache.set(cardName, card);
        return card;
    } catch (error) {
        console.error(`Error fetching ${cardName}:`, error);
        return null;
    }
}

// Scryfall rate limiting: max 10 requests per second
async function fetchCardsWithDelay(cards, category) {
    const results = [];
    
    for (let i = 0; i < cards.length; i++) {
        const card = await fetchCard(cards[i]);
        if (card) {
            results.push({ ...card, category });
        }
        
        // Respect Scryfall rate limit (100ms between requests)
        if (i < cards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return results;
}

// ========== UI FUNCTIONS ==========

function getCardImageUrl(card) {
    if (card.image_uris) {
        return card.image_uris.normal || card.image_uris.small;
    }
    // Handle double-faced cards
    if (card.card_faces && card.card_faces[0].image_uris) {
        return card.card_faces[0].image_uris.normal;
    }
    return 'https://via.placeholder.com/200x280?text=No+Image';
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card-item';
    div.dataset.category = card.category;
    
    if (card.category === 'commander') {
        div.classList.add('commander-card');
    }

    const imageUrl = getCardImageUrl(card);
    
    div.innerHTML = `
        <img src="${imageUrl}" alt="${card.name}" loading="lazy">
        <div class="card-name-overlay">
            <span>${card.name}</span>
        </div>
        <span class="category-badge">${categoryNames[card.category]}</span>
    `;

    // Click handler for modal
    div.addEventListener('click', () => showCardModal(card));

    return div;
}

function showCardModal(card) {
    const modal = document.getElementById('card-modal');
    const modalImage = document.getElementById('modal-image');
    const modalInfo = document.getElementById('modal-info');

    // Get high-res image
    let imageUrl = card.image_uris?.large || card.image_uris?.normal;
    if (!imageUrl && card.card_faces) {
        imageUrl = card.card_faces[0].image_uris?.large;
    }

    modalImage.src = imageUrl || '';
    
    // Build info section
    let infoHtml = `<h3>${card.name}</h3>`;
    infoHtml += `<p><strong>Mana Cost:</strong> ${card.mana_cost || 'N/A'}</p>`;
    infoHtml += `<p><strong>Type:</strong> ${card.type_line}</p>`;
    
    if (card.oracle_text) {
        infoHtml += `<p><strong>Text:</strong> ${card.oracle_text}</p>`;
    }
    
    if (card.power && card.toughness) {
        infoHtml += `<p><strong>P/T:</strong> ${card.power}/${card.toughness}</p>`;
    }

    infoHtml += `<p><strong>Category:</strong> ${categoryNames[card.category]}</p>`;
    infoHtml += `<p><a href="${card.scryfall_uri}" target="_blank" style="color: var(--primary-gold);">View on Scryfall →</a></p>`;

    modalInfo.innerHTML = infoHtml;
    modal.classList.add('show');
}

function hideCardModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('show');
}

function filterCards(category) {
    const cards = document.querySelectorAll('.card-item');
    
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function toggleView(view) {
    const grid = document.getElementById('card-grid');
    
    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

// ========== INITIALIZATION ==========

async function loadDeck() {
    const grid = document.getElementById('card-grid');
    const loading = document.getElementById('loading');
    const cardCountEl = document.getElementById('card-count');
    
    let allCards = [];
    let totalCards = 0;

    // Fetch all categories
    for (const [category, cards] of Object.entries(deckData)) {
        const fetchedCards = await fetchCardsWithDelay(cards, category);
        allCards = allCards.concat(fetchedCards);
        
        // Count cards (basics count as multiple)
        if (category === 'lands') {
            // 5 Islands + 3 Plains + 22 other lands = 30 lands total in grid
            // but we need to account for basics
            totalCards += cards.length + 4; // +4 for extra basic lands
        } else {
            totalCards += cards.length;
        }
    }

    // Sort: Commander first, then by category
    allCards.sort((a, b) => {
        if (a.category === 'commander') return -1;
        if (b.category === 'commander') return 1;
        return 0;
    });

    // Hide loading, show cards
    loading.classList.add('hidden');

    // Render cards
    allCards.forEach(card => {
        const element = createCardElement(card);
        grid.appendChild(element);
    });

    // Update card count
    cardCountEl.textContent = '100';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load deck
    loadDeck();

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCards(btn.dataset.filter);
        });
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            toggleView(btn.dataset.view);
        });
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', hideCardModal);
    document.getElementById('card-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            hideCardModal();
        }
    });

    // Keyboard close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideCardModal();
        }
    });
});

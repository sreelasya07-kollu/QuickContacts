# ContactHub – Smart Contact Manager

A full-stack contact management web application built with **Flask** (Python) and **HTML/CSS/JavaScript**. ContactHub demonstrates practical use of Python data structures — **List**, **Dictionary**, and **Queue (deque)** — while providing an efficient contact organization, search, and performance analysis system.

![ContactHub](https://img.shields.io/badge/Python-Flask-6366f1?style=flat-square)
![Theme](https://img.shields.io/badge/UI-Dark%20Theme-1a1d27?style=flat-square)

---

## Features

| Feature | Description |
|---------|-------------|
| **Home Dashboard** | Total contacts, favorites count, recent searches, category overview |
| **Add Contact** | Name, phone, email, category (Family, Friends, Work, Emergency) |
| **View Contacts** | Table view with edit, delete, and favorite toggle |
| **Search** | Instant suggestions while typing; search by name or phone |
| **Favorites** | Mark/unmark contacts; dedicated favorites page |
| **Recent Searches** | Last 5 searches stored using Python `deque` (Queue) |
| **Categories** | Filter by category; emergency contacts highlighted in red |
| **Performance Analysis** | Compare List O(n) vs Dictionary O(1) lookup with Chart.js |

---

## Project Structure

```
quickcontacts/
├── app.py                  # Flask backend & REST APIs
├── requirements.txt        # Python dependencies
├── README.md
├── static/
│   ├── css/
│   │   └── style.css       # Dark theme responsive styles
│   └── js/
│       ├── main.js         # Shared utilities & sidebar
│       ├── dashboard.js    # Dashboard stats
│       ├── add.js          # Add contact form
│       ├── contacts.js     # View/edit/delete contacts
│       ├── search.js       # Search & suggestions
│       ├── favorites.js    # Favorites page
│       └── performance.js  # Chart.js benchmark
└── templates/
    ├── base.html           # Layout with sidebar navigation
    ├── index.html          # Dashboard
    ├── add.html            # Add contact
    ├── contacts.html       # View contacts
    ├── search.html         # Search contacts
    ├── favorites.html      # Favorites
    └── performance.html    # Performance analysis
```

---

## Data Structures Used

### Python List
Contacts are stored sequentially in `contacts_list`. Searching requires iterating through every contact.

```
Time Complexity: O(n) — Linear Search
```

### Python Dictionary
Contacts are indexed by ID in `contacts_dict` for instant hash-based lookup.

```
Time Complexity: O(1) — Hash Lookup
```

### Python Queue (collections.deque)
Recent searches are stored in a bounded queue with `maxlen=5`, automatically removing the oldest entry when full.

```
FIFO Queue — Last 5 searched contacts
```

---

## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip

### Steps

1. **Clone or navigate to the project folder:**
   ```bash
   cd quickcontacts
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate        # macOS/Linux
   venv\Scripts\activate           # Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   python app.py
   ```

5. **Open in browser:**
   ```
   http://127.0.0.1:5001
   ```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/contacts` | Get all contacts (optional `?category=`) |
| POST | `/api/contacts` | Add a new contact |
| PUT | `/api/contacts/<id>` | Update a contact |
| DELETE | `/api/contacts/<id>` | Delete a contact |
| POST | `/api/contacts/<id>/favorite` | Toggle favorite status |
| GET | `/api/favorites` | Get favorite contacts |
| GET | `/api/search?q=` | Search by name or phone |
| GET | `/api/suggestions?q=` | Instant search suggestions |
| GET | `/api/recent-searches` | Get recent search queue |
| POST | `/api/recent-searches/<id>` | Add contact to recent searches |
| GET | `/api/performance?q=` | Run lookup benchmark |

---

## Sample Contact Data

The app loads 10 sample contacts on startup, including:

- **Sree Lasya Kollu** — Family (Favorite)
- **Siddu Kumar** — Friends (Favorite)
- **Dr. Meera Singh** — Emergency (Favorite)
- **Emergency Services** — Emergency (Favorite)
- And 6 more contacts across all categories

---

## Performance Analysis

Navigate to **Performance Analysis** in the sidebar to:

1. Enter a search query
2. Click **Run Benchmark**
3. View list vs dictionary search times (measured with Python `time.perf_counter()`)
4. See results in a **Chart.js** bar graph
5. Learn which data structure is faster

---

## Technologies

- **Backend:** Python, Flask
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js 4.x
- **Fonts:** Inter (Google Fonts)
- **Data Structures:** List, Dictionary, Queue (deque)

---

## Authors

Built as a data structures assignment demonstrating List, Dictionary, and Queue concepts in a real-world contact management application.

**ContactHub** — Smart Contact Manager

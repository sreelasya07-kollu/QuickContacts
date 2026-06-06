# ContactHub – Smart Contact Manager

A full-stack contact management web application built with **Flask** (Python) and **HTML/CSS/JavaScript**. ContactHub demonstrates practical applications of data structures by comparing contact lookup performance using Python **Lists** and **Dictionaries**.

## Project Objective

This project demonstrates practical applications of data structures by comparing contact lookup performance using Python Lists and Dictionaries. Users can manage contacts and visualize the impact of different search techniques through execution-time analysis and graphical reports.

---

## Features

### Contact Management
- **Add Contact** – Name, phone, email
- **View Contacts** – Table display from List storage
- **Edit Contact** – Update existing records in both List and Dictionary
- **Delete Contact** – Remove from both data structures
- **Search Contact** – Search by name or phone with live performance comparison

### Performance Analysis
- **List Search** – Linear Search O(n) with comparison count
- **Dictionary Search** – Hash Lookup O(1) using phone index
- **Execution timing** – Measured with Python `time` module
- **Generate Sample Data** – 100, 1000, 5000, or 10000 contacts
- **Chart.js visualizations** – Bar chart and line chart
- **Performance Report table** – Comparison across all data sizes

---

## Data Structures

| Structure | Usage | Time Complexity |
|-----------|-------|-----------------|
| **Python List** | Sequential contact storage | Search: O(n) |
| **Python Dictionary** | ID index + phone hash index | Lookup: O(1) |

---

## Project Structure

```
quickcontacts/
├── app.py
├── requirements.txt
├── run.sh
├── static/
│   ├── css/style.css
│   └── js/
│       ├── main.js
│       ├── dashboard.js
│       ├── add.js
│       ├── contacts.js
│       ├── search.js
│       └── performance.js
└── templates/
    ├── base.html
    ├── index.html
    ├── add.html
    ├── contacts.html
    ├── search.html
    └── performance.html
```

---

## Installation

```bash
cd quickcontacts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open **http://127.0.0.1:5001**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Total contact count |
| GET | `/api/contacts` | Get all contacts |
| POST | `/api/contacts` | Add contact |
| PUT | `/api/contacts/<id>` | Update contact |
| DELETE | `/api/contacts/<id>` | Delete contact |
| GET | `/api/search?q=` | Search with performance metrics |
| GET | `/api/suggestions?q=` | Search suggestions |
| POST | `/api/generate/<count>` | Generate sample data (100/1000/5000/10000) |
| GET | `/api/performance/search?q=` | Run live search benchmark |
| GET | `/api/performance/report` | Full performance report table |

---

## Performance Report

| Data Size | List Search Time | Dictionary Search Time |
|-----------|------------------|------------------------|
| 100 | Measured (ms) | Measured (ms) |
| 1000 | Measured (ms) | Measured (ms) |
| 5000 | Measured (ms) | Measured (ms) |
| 10000 | Measured (ms) | Measured (ms) |

---

## Technologies

- **Backend:** Python, Flask
- **Frontend:** HTML5, CSS3, JavaScript
- **Charts:** Chart.js 4.x
- **Timing:** Python `time.perf_counter()`

**ContactHub** – DSA Contact Manager

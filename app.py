from collections import deque
from datetime import datetime

from flask import Flask, jsonify, render_template, request
import time

app = Flask(__name__)

# Data structures
contacts_list = []
contacts_dict = {}
phone_index = {}
recent_searches = deque(maxlen=5)
next_id = 1

last_search = {
    "query": "",
    "contact_name": "",
    "contact_phone": "",
    "searched_at": "",
    "list_time_ms": 0,
    "dict_time_ms": 0,
    "list_comparisons": 0,
    "dict_comparisons": 0,
}

CATEGORIES = ["Family", "Friends", "Work", "Emergency"]

SAMPLE_CONTACTS = [
    {"name": "Sree Lasya Kollu", "phone": "9876543210", "email": "lasya@email.com", "category": "Family", "favorite": True},
    {"name": "Siddu Kumar", "phone": "9123456780", "email": "siddu@email.com", "category": "Friends", "favorite": True},
    {"name": "Rajesh Patel", "phone": "9988776655", "email": "rajesh@work.com", "category": "Work", "favorite": False},
    {"name": "Dr. Meera Singh", "phone": "9111222333", "email": "meera@hospital.com", "category": "Emergency", "favorite": True},
    {"name": "Ananya Sharma", "phone": "8765432109", "email": "ananya@email.com", "category": "Family", "favorite": False},
    {"name": "Vikram Reddy", "phone": "7654321098", "email": "vikram@company.com", "category": "Work", "favorite": False},
    {"name": "Priya Nair", "phone": "6543210987", "email": "priya@email.com", "category": "Friends", "favorite": True},
    {"name": "Emergency Services", "phone": "100", "email": "emergency@gov.in", "category": "Emergency", "favorite": True},
    {"name": "Ravi Teja", "phone": "5432109876", "email": "ravi@email.com", "category": "Friends", "favorite": False},
    {"name": "Kavitha Rao", "phone": "4321098765", "email": "kavitha@work.com", "category": "Work", "favorite": False},
]


def init_sample_data():
    global next_id
    for contact in SAMPLE_CONTACTS:
        add_contact_to_storage(
            contact["name"],
            contact["phone"],
            contact["email"],
            contact["category"],
            contact["favorite"],
        )


def add_contact_to_storage(name, phone, email, category, favorite=False):
    global next_id
    contact = {
        "id": next_id,
        "name": name,
        "phone": phone,
        "email": email,
        "category": category,
        "favorite": favorite,
    }
    contacts_list.append(contact)
    contacts_dict[next_id] = contact
    phone_index[contact["phone"]] = contact
    next_id += 1
    return contact


def remove_contact_from_storage(contact_id):
    contact = contacts_dict.pop(contact_id, None)
    if contact:
        phone_index.pop(contact["phone"], None)
        contacts_list[:] = [c for c in contacts_list if c["id"] != contact_id]
    return contact


def update_contact_in_storage(contact_id, data):
    contact = contacts_dict.get(contact_id)
    if not contact:
        return None

    old_phone = contact["phone"]
    contact["name"] = data.get("name", contact["name"])
    contact["phone"] = data.get("phone", contact["phone"])
    contact["email"] = data.get("email", contact["email"])
    contact["category"] = data.get("category", contact["category"])
    if "favorite" in data:
        contact["favorite"] = data["favorite"]

    if old_phone != contact["phone"]:
        phone_index.pop(old_phone, None)
        phone_index[contact["phone"]] = contact

    for i, c in enumerate(contacts_list):
        if c["id"] == contact_id:
            contacts_list[i] = contact
            break
    return contact


def search_list(query):
    query_lower = query.lower()
    results = []
    comparisons = 0
    for contact in contacts_list:
        comparisons += 1
        if query_lower in contact["name"].lower() or query in contact["phone"]:
            results.append(contact)
    return results, comparisons


def search_dict_by_phone(phone):
    comparisons = 1
    contact = phone_index.get(phone)
    results = [contact] if contact else []
    return results, comparisons


def measure_search_performance(query):
    list_start = time.perf_counter()
    list_results, list_comparisons = search_list(query)
    list_time = time.perf_counter() - list_start

    phone_target = query
    if phone_target not in phone_index and list_results:
        phone_target = list_results[0]["phone"]

    dict_start = time.perf_counter()
    dict_results, dict_comparisons = search_dict_by_phone(phone_target)
    dict_time = time.perf_counter() - dict_start

    faster = "Dictionary (O(1))" if dict_time <= list_time else "List (O(n))"

    return {
        "query": query,
        "list_time_ms": round(list_time * 1000, 4),
        "dict_time_ms": round(dict_time * 1000, 4),
        "list_comparisons": list_comparisons,
        "dict_comparisons": dict_comparisons,
        "list_complexity": "O(n)",
        "dict_complexity": "O(1)",
        "faster": faster,
        "list_matches": len(list_results),
        "dict_matches": len(dict_results),
        "total_contacts": len(contacts_list),
    }


def find_contacts_in_dict(query):
    query = query.lower()
    results = []
    for contact in contacts_dict.values():
        if query in contact["name"].lower() or query in contact["phone"]:
            results.append(contact)
    return results


def lookup_list_by_id(contact_id):
    for contact in contacts_list:
        if contact["id"] == contact_id:
            return contact
    return None


def lookup_dict_by_id(contact_id):
    return contacts_dict.get(contact_id)


def add_to_recent_searches(contact):
    for item in recent_searches:
        if item["id"] == contact["id"]:
            return
    recent_searches.appendleft(dict(contact))


def measure_performance(query):
    iterations = 5000

    list_start = time.perf_counter()
    for _ in range(iterations):
        search_list(query)[0]
    list_time = (time.perf_counter() - list_start) / iterations

    dict_start = time.perf_counter()
    for _ in range(iterations):
        find_contacts_in_dict(query)
    dict_time = (time.perf_counter() - dict_start) / iterations

    target_id = contacts_list[-1]["id"] if contacts_list else 0

    list_id_start = time.perf_counter()
    for _ in range(iterations):
        lookup_list_by_id(target_id)
    list_id_time = (time.perf_counter() - list_id_start) / iterations

    dict_id_start = time.perf_counter()
    for _ in range(iterations):
        lookup_dict_by_id(target_id)
    dict_id_time = (time.perf_counter() - dict_id_start) / iterations

    faster = "Dictionary (Hash Lookup - O(1))" if dict_time <= list_time else "List (Linear Search - O(n))"

    return {
        "list_time_ms": round(list_time * 1000, 4),
        "dict_time_ms": round(dict_time * 1000, 4),
        "list_id_time_ms": round(list_id_time * 1000, 4),
        "dict_id_time_ms": round(dict_id_time * 1000, 4),
        "faster": faster,
        "total_contacts": len(contacts_list),
        "query": query,
    }


# Page routes
@app.route("/")
def dashboard():
    return render_template("index.html", active="dashboard")


@app.route("/add")
def add_contact_page():
    return render_template("add.html", active="add", categories=CATEGORIES)


@app.route("/contacts")
def contacts_page():
    return render_template("contacts.html", active="contacts", categories=CATEGORIES)


@app.route("/search")
def search_page():
    return render_template("search.html", active="search")


@app.route("/favorites")
def favorites_page():
    return render_template("favorites.html", active="favorites")


@app.route("/performance")
def performance_page():
    return render_template("performance.html", active="performance")


# REST API routes
@app.route("/api/stats")
def api_stats():
    favorites_count = sum(1 for c in contacts_list if c["favorite"])
    category_counts = {cat: 0 for cat in CATEGORIES}
    for contact in contacts_list:
        category_counts[contact["category"]] += 1

    return jsonify({
        "total_contacts": len(contacts_list),
        "favorite_contacts": favorites_count,
        "recent_searches": list(recent_searches),
        "category_counts": category_counts,
        "last_search": last_search,
    })


@app.route("/api/contacts", methods=["GET"])
def api_get_contacts():
    category = request.args.get("category")
    contacts = contacts_list
    if category and category != "All":
        contacts = [c for c in contacts_list if c["category"] == category]
    return jsonify(contacts)


@app.route("/api/contacts", methods=["POST"])
def api_add_contact():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    required = ["name", "phone", "email", "category"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    if data["category"] not in CATEGORIES:
        return jsonify({"error": "Invalid category"}), 400

    contact = add_contact_to_storage(
        data["name"].strip(),
        data["phone"].strip(),
        data["email"].strip(),
        data["category"],
        data.get("favorite", False),
    )
    return jsonify(contact), 201


@app.route("/api/contacts/<int:contact_id>", methods=["PUT"])
def api_update_contact(contact_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    contact = update_contact_in_storage(contact_id, data)
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    return jsonify(contact)


@app.route("/api/contacts/<int:contact_id>", methods=["DELETE"])
def api_delete_contact(contact_id):
    contact = remove_contact_from_storage(contact_id)
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    return jsonify({"message": "Contact deleted", "contact": contact})


@app.route("/api/contacts/<int:contact_id>/favorite", methods=["POST"])
def api_toggle_favorite(contact_id):
    contact = contacts_dict.get(contact_id)
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    contact["favorite"] = not contact["favorite"]
    for i, c in enumerate(contacts_list):
        if c["id"] == contact_id:
            contacts_list[i]["favorite"] = contact["favorite"]
            break
    return jsonify(contact)


@app.route("/api/favorites")
def api_favorites():
    favorites = [c for c in contacts_list if c["favorite"]]
    return jsonify(favorites)


@app.route("/api/search")
def api_search():
    global last_search
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": [], "performance": None})

    performance = measure_search_performance(query)
    results, _ = search_list(query)

    if results:
        add_to_recent_searches(results[0])
        last_search = {
            "query": query,
            "contact_name": results[0]["name"],
            "contact_phone": results[0]["phone"],
            "searched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "list_time_ms": performance["list_time_ms"],
            "dict_time_ms": performance["dict_time_ms"],
            "list_comparisons": performance["list_comparisons"],
            "dict_comparisons": performance["dict_comparisons"],
        }
    else:
        last_search = {
            "query": query,
            "contact_name": "No match found",
            "contact_phone": "—",
            "searched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "list_time_ms": performance["list_time_ms"],
            "dict_time_ms": performance["dict_time_ms"],
            "list_comparisons": performance["list_comparisons"],
            "dict_comparisons": performance["dict_comparisons"],
        }

    return jsonify({"results": results, "performance": performance})


@app.route("/api/suggestions")
def api_suggestions():
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([])

    suggestions = []
    for contact in contacts_list:
        if query in contact["name"].lower() or query in contact["phone"]:
            suggestions.append({
                "id": contact["id"],
                "name": contact["name"],
                "phone": contact["phone"],
                "category": contact["category"],
            })
        if len(suggestions) >= 5:
            break
    return jsonify(suggestions)


@app.route("/api/recent-searches")
def api_recent_searches():
    return jsonify(list(recent_searches))


@app.route("/api/recent-searches/<int:contact_id>", methods=["POST"])
def api_add_recent_search(contact_id):
    contact = contacts_dict.get(contact_id)
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    add_to_recent_searches(contact)
    return jsonify(list(recent_searches))


@app.route("/api/performance")
def api_performance():
    query = request.args.get("q", "a").strip() or "a"
    return jsonify(measure_performance(query))


init_sample_data()

if __name__ == "__main__":
    app.run(debug=False, port=5001)

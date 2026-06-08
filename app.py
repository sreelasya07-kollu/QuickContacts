import time
from datetime import datetime

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

contacts_list = []
contacts_dict = {}
phone_index = {}
next_id = 1

SAMPLE_SIZES = [100, 1000, 5000, 10000]
CATEGORIES = ["Family", "Friends", "Work", "Other"]

last_added = {"name": "", "phone": "", "category": "", "added_at": ""}
last_search = {"name": "", "phone": "", "category": "", "searched_at": ""}
best_search_method = "Smart Search"

DEFAULT_CONTACTS = [
    {"name": "Sree Lasya Kollu", "phone": "9876543210", "email": "lasya@email.com", "category": "Family"},
    {"name": "Siddu Kumar", "phone": "9123456780", "email": "siddu@email.com", "category": "Friends"},
    {"name": "Rajesh Patel", "phone": "9988776655", "email": "rajesh@work.com", "category": "Work"},
    {"name": "Ananya Sharma", "phone": "8765432109", "email": "ananya@email.com", "category": "Family"},
    {"name": "Vikram Reddy", "phone": "7654321098", "email": "vikram@company.com", "category": "Work"},
]


def friendly_faster(list_time, dict_time):
    global best_search_method
    if dict_time <= list_time:
        best_search_method = "Smart Search"
        return "Smart Search"
    best_search_method = "Normal Search"
    return "Normal Search"


def clear_contacts():
    global next_id
    contacts_list.clear()
    contacts_dict.clear()
    phone_index.clear()
    next_id = 1


def add_contact_to_storage(name, phone, email, category="Other"):
    global next_id, last_added
    contact = {
        "id": next_id,
        "name": name.strip(),
        "phone": phone.strip(),
        "email": email.strip(),
        "category": category if category in CATEGORIES else "Other",
    }
    contacts_list.append(contact)
    contacts_dict[next_id] = contact
    phone_index[contact["phone"]] = contact
    next_id += 1

    last_added = {
        "name": contact["name"],
        "phone": contact["phone"],
        "category": contact["category"],
        "added_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    return contact


def remove_contact_from_storage(contact_id):
    contact = contacts_dict.pop(contact_id, None)
    if not contact:
        return None
    phone_index.pop(contact["phone"], None)
    contacts_list[:] = [c for c in contacts_list if c["id"] != contact_id]
    return contact


def update_contact_in_storage(contact_id, data):
    contact = contacts_dict.get(contact_id)
    if not contact:
        return None

    old_phone = contact["phone"]
    contact["name"] = data.get("name", contact["name"]).strip()
    contact["phone"] = data.get("phone", contact["phone"]).strip()
    contact["email"] = data.get("email", contact["email"]).strip()
    if data.get("category"):
        contact["category"] = data["category"] if data["category"] in CATEGORIES else contact["category"]

    if old_phone != contact["phone"]:
        phone_index.pop(old_phone, None)
        phone_index[contact["phone"]] = contact

    for index, item in enumerate(contacts_list):
        if item["id"] == contact_id:
            contacts_list[index] = contact
            break
    return contact


def search_list_linear(query):
    query_lower = query.lower()
    comparisons = 0
    results = []

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


def build_temp_contacts(size):
    temp_list = []
    temp_phone = {}

    for index in range(1, size + 1):
        contact = {
            "id": index,
            "name": f"Contact {index}",
            "phone": f"900000{index:05d}",
            "email": f"contact{index}@email.com",
            "category": "Other",
        }
        temp_list.append(contact)
        temp_phone[contact["phone"]] = contact

    return temp_list, temp_phone


def benchmark_temp_size(size):
    temp_list, temp_phone = build_temp_contacts(size)
    target_phone = temp_list[-1]["phone"]

    list_start = time.perf_counter()
    list_comparisons = 0
    for contact in temp_list:
        list_comparisons += 1
        if contact["phone"] == target_phone:
            break
    list_time = time.perf_counter() - list_start

    dict_start = time.perf_counter()
    dict_comparisons = 1
    temp_phone.get(target_phone)
    dict_time = time.perf_counter() - dict_start

    faster = friendly_faster(list_time, dict_time)

    return {
        "data_size": size,
        "list_time_ms": round(list_time * 1000, 4),
        "dict_time_ms": round(dict_time * 1000, 4),
        "list_comparisons": list_comparisons,
        "dict_comparisons": dict_comparisons,
        "contacts_checked": list_comparisons,
        "lookups_performed": dict_comparisons,
        "faster": faster,
        "normal_search_time_ms": round(list_time * 1000, 4),
        "smart_search_time_ms": round(dict_time * 1000, 4),
    }


def measure_search_performance(query):
    list_start = time.perf_counter()
    list_results, list_comparisons = search_list_linear(query)
    list_time = time.perf_counter() - list_start

    phone_target = query
    if phone_target not in phone_index and list_results:
        phone_target = list_results[0]["phone"]

    dict_start = time.perf_counter()
    dict_results, dict_comparisons = search_dict_by_phone(phone_target)
    dict_time = time.perf_counter() - dict_start

    faster = friendly_faster(list_time, dict_time)

    return {
        "query": query,
        "list_time_ms": round(list_time * 1000, 4),
        "dict_time_ms": round(dict_time * 1000, 4),
        "normal_search_time_ms": round(list_time * 1000, 4),
        "smart_search_time_ms": round(dict_time * 1000, 4),
        "list_comparisons": list_comparisons,
        "dict_comparisons": dict_comparisons,
        "contacts_checked": list_comparisons,
        "lookups_performed": dict_comparisons,
        "faster": faster,
        "best_search_method": faster,
        "list_matches": len(list_results),
        "dict_matches": len(dict_results),
        "total_contacts": len(contacts_list),
    }


def generate_sample_data(count):
    clear_contacts()
    for index in range(1, count + 1):
        add_contact_to_storage(
            f"Contact {index}",
            f"900000{index:05d}",
            f"contact{index}@email.com",
            "Other",
        )
    return len(contacts_list)


def init_default_contacts():
    clear_contacts()
    for contact in DEFAULT_CONTACTS:
        add_contact_to_storage(
            contact["name"],
            contact["phone"],
            contact["email"],
            contact["category"],
        )


@app.route("/")
def dashboard():
    return render_template("index.html", active="dashboard")


@app.route("/add")
def add_contact_page():
    return render_template("add.html", active="add", categories=CATEGORIES)


@app.route("/contacts")
def contacts_page():
    return render_template("contacts.html", active="contacts")


@app.route("/search")
def search_page():
    return render_template("search.html", active="search")


@app.route("/performance")
def performance_page():
    return render_template("performance.html", active="performance")


@app.route("/api/stats")
def api_stats():
    return jsonify({
        "total_contacts": len(contacts_list),
        "last_added": last_added,
        "last_search": last_search,
        "best_search_method": best_search_method,
    })


@app.route("/api/contacts", methods=["GET"])
def api_get_contacts():
    return jsonify(contacts_list)


@app.route("/api/contacts", methods=["POST"])
def api_add_contact():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    category = (data.get("category") or "Other").strip()

    if not name or not phone or not email:
        return jsonify({"error": "Name, phone, and email are required"}), 400

    if phone in phone_index:
        return jsonify({"error": "Phone number already exists"}), 400

    contact = add_contact_to_storage(name, phone, email, category)
    return jsonify(contact), 201


@app.route("/api/contacts/<int:contact_id>", methods=["PUT"])
def api_update_contact(contact_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    existing = contacts_dict.get(contact_id)
    if not existing:
        return jsonify({"error": "Contact not found"}), 404

    new_phone = (data.get("phone") or existing["phone"]).strip()
    if new_phone != existing["phone"] and new_phone in phone_index:
        return jsonify({"error": "Phone number already exists"}), 400

    contact = update_contact_in_storage(contact_id, data)
    return jsonify(contact)


@app.route("/api/contacts/<int:contact_id>", methods=["DELETE"])
def api_delete_contact(contact_id):
    contact = remove_contact_from_storage(contact_id)
    if not contact:
        return jsonify({"error": "Contact not found"}), 404
    return jsonify({"message": "Contact deleted", "contact": contact})


@app.route("/api/search")
def api_search():
    global last_search
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": [], "performance": None})

    performance = measure_search_performance(query)
    results, _ = search_list_linear(query)

    if results:
        contact = results[0]
        last_search = {
            "name": contact["name"],
            "phone": contact["phone"],
            "category": contact["category"],
            "searched_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        }
    else:
        last_search = {
            "name": "No match found",
            "phone": "—",
            "category": "—",
            "searched_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        }

    return jsonify({"results": results, "performance": performance})


@app.route("/api/suggestions")
def api_suggestions():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    suggestions = []
    query_lower = query.lower()
    for contact in contacts_list:
        if query_lower in contact["name"].lower() or query in contact["phone"]:
            suggestions.append({
                "id": contact["id"],
                "name": contact["name"],
                "phone": contact["phone"],
                "email": contact["email"],
                "category": contact["category"],
            })
        if len(suggestions) >= 8:
            break
    return jsonify(suggestions)


@app.route("/api/generate/<int:count>", methods=["POST"])
def api_generate_sample(count):
    if count not in SAMPLE_SIZES:
        return jsonify({"error": "Supported sizes: 100, 1000, 5000, 10000"}), 400

    total = generate_sample_data(count)
    return jsonify({"message": f"Generated {total} sample contacts", "total_contacts": total})


@app.route("/api/performance/search")
def api_performance_search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Search query is required"}), 400
    return jsonify(measure_search_performance(query))


@app.route("/api/performance/report")
def api_performance_report():
    report = [benchmark_temp_size(size) for size in SAMPLE_SIZES]
    return jsonify(report)


init_default_contacts()

if __name__ == "__main__":
    app.run(debug=False, port=5001)

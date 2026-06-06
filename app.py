import time

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

contacts_list = []
contacts_dict = {}
phone_index = {}
next_id = 1

SAMPLE_SIZES = [100, 1000, 5000, 10000]

DEFAULT_CONTACTS = [
    {"name": "Sree Lasya Kollu", "phone": "9876543210", "email": "lasya@email.com"},
    {"name": "Siddu Kumar", "phone": "9123456780", "email": "siddu@email.com"},
    {"name": "Rajesh Patel", "phone": "9988776655", "email": "rajesh@work.com"},
    {"name": "Ananya Sharma", "phone": "8765432109", "email": "ananya@email.com"},
    {"name": "Vikram Reddy", "phone": "7654321098", "email": "vikram@company.com"},
]


def clear_contacts():
    global next_id
    contacts_list.clear()
    contacts_dict.clear()
    phone_index.clear()
    next_id = 1


def add_contact_to_storage(name, phone, email):
    global next_id
    contact = {
        "id": next_id,
        "name": name.strip(),
        "phone": phone.strip(),
        "email": email.strip(),
    }
    contacts_list.append(contact)
    contacts_dict[next_id] = contact
    phone_index[contact["phone"]] = contact
    next_id += 1
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
        name_match = query_lower in contact["name"].lower()
        phone_match = query in contact["phone"]
        if name_match or phone_match:
            results.append(contact)

    return results, comparisons


def search_dict_by_phone(query):
    comparisons = 1
    contact = phone_index.get(query)
    results = [contact] if contact else []
    return results, comparisons


def search_list_by_phone(phone):
    comparisons = 0
    for contact in contacts_list:
        comparisons += 1
        if contact["phone"] == phone:
            return contact, comparisons
    return None, comparisons


def build_temp_contacts(size):
    temp_list = []
    temp_dict = {}
    temp_phone = {}

    for index in range(1, size + 1):
        contact = {
            "id": index,
            "name": f"Contact {index}",
            "phone": f"900000{index:05d}",
            "email": f"contact{index}@email.com",
        }
        temp_list.append(contact)
        temp_dict[index] = contact
        temp_phone[contact["phone"]] = contact

    return temp_list, temp_dict, temp_phone


def benchmark_temp_size(size):
    temp_list, _, temp_phone = build_temp_contacts(size)
    target_phone = temp_list[-1]["phone"]

    list_start = time.perf_counter()
    list_comparisons = 0
    list_found = None
    for contact in temp_list:
        list_comparisons += 1
        if contact["phone"] == target_phone:
            list_found = contact
            break
    list_time = time.perf_counter() - list_start

    dict_start = time.perf_counter()
    dict_comparisons = 1
    dict_found = temp_phone.get(target_phone)
    dict_time = time.perf_counter() - dict_start

    faster = "Dictionary (O(1))" if dict_time <= list_time else "List (O(n))"

    return {
        "data_size": size,
        "list_time_ms": round(list_time * 1000, 4),
        "dict_time_ms": round(dict_time * 1000, 4),
        "list_comparisons": list_comparisons,
        "dict_comparisons": dict_comparisons,
        "list_complexity": "O(n)",
        "dict_complexity": "O(1)",
        "faster": faster,
        "target_phone": target_phone,
        "found": list_found is not None and dict_found is not None,
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


def generate_sample_data(count):
    clear_contacts()
    for index in range(1, count + 1):
        add_contact_to_storage(
            f"Contact {index}",
            f"900000{index:05d}",
            f"contact{index}@email.com",
        )
    return len(contacts_list)


def init_default_contacts():
    clear_contacts()
    for contact in DEFAULT_CONTACTS:
        add_contact_to_storage(contact["name"], contact["phone"], contact["email"])


@app.route("/")
def dashboard():
    return render_template("index.html", active="dashboard")


@app.route("/add")
def add_contact_page():
    return render_template("add.html", active="add")


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
    return jsonify({"total_contacts": len(contacts_list)})


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

    if not name or not phone or not email:
        return jsonify({"error": "Name, phone, and email are required"}), 400

    if phone in phone_index:
        return jsonify({"error": "Phone number already exists"}), 400

    contact = add_contact_to_storage(name, phone, email)
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
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"results": [], "performance": None})

    results, _ = search_list_linear(query)
    performance = measure_search_performance(query)

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
            suggestions.append(
                {
                    "id": contact["id"],
                    "name": contact["name"],
                    "phone": contact["phone"],
                }
            )
        if len(suggestions) >= 5:
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

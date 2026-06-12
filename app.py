"""ContactHub backend: Flask API with list and dictionary data structures."""

import time
from datetime import datetime

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# List stores contacts in insertion order for linear search and display.
contacts_list = []
# Dictionary maps contact id -> contact for direct access by id.
contacts_dict = {}
# Phone index maps phone number -> contact for O(1) hash lookup.
phone_index = {}
next_id = 1

SORT_ARRAY_MAX_SIZE = 2000
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
    """Return which search method was faster and update the dashboard label."""
    global best_search_method
    if dict_time <= list_time:
        best_search_method = "Smart Search"
        return "Smart Search"
    best_search_method = "Normal Search"
    return "Normal Search"


def clear_contacts():
    """Reset all in-memory contact storage structures."""
    global next_id
    contacts_list.clear()
    contacts_dict.clear()
    phone_index.clear()
    next_id = 1


def add_contact_to_storage(name, phone, email, category="Other"):
    """Add a contact to the list, id dictionary, and phone hash index."""
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
    """Remove a contact from all storage structures by id."""
    contact = contacts_dict.pop(contact_id, None)
    if not contact:
        return None
    phone_index.pop(contact["phone"], None)
    contacts_list[:] = [c for c in contacts_list if c["id"] != contact_id]
    return contact


def update_contact_in_storage(contact_id, data):
    """Update a contact and keep the phone hash index in sync."""
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
    """Linear search O(n): scan the contact list one by one."""
    query_lower = query.lower()
    comparisons = 0
    results = []

    for contact in contacts_list:
        comparisons += 1
        if query_lower in contact["name"].lower() or query in contact["phone"]:
            results.append(contact)

    return results, comparisons


def search_dict_by_phone(phone):
    """Hash lookup O(1): find a contact by phone using the phone index."""
    comparisons = 1
    contact = phone_index.get(phone)
    results = [contact] if contact else []
    return results, comparisons


def build_temp_contacts(size):
    """Build a temporary contact list and phone index for benchmarking."""
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
    """Measure search times for a temporary dataset of the given size."""
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

    result = build_timing_result(
        list_time,
        dict_time,
        list_comparisons,
        dict_comparisons,
        total_contacts=size,
    )
    result["data_size"] = size
    return result


def benchmark_iterations():
    """Choose repeat count for stable search timing on larger lists."""
    size = len(contacts_list)
    if size < 50:
        return 5000
    if size < 500:
        return 1000
    return max(100, min(5000, size * 5))


def ms_from_seconds(seconds):
    """Convert a seconds value from perf_counter into milliseconds."""
    return round(seconds * 1000, 6)


def build_timing_result(
    list_time,
    dict_time,
    list_comparisons,
    dict_comparisons,
    query="",
    list_matches=0,
    dict_matches=0,
    total_contacts=None,
):
    """Format list vs dictionary search timings into a JSON-ready response."""
    normal_ms = ms_from_seconds(list_time)
    smart_ms = ms_from_seconds(dict_time)
    faster = friendly_faster(list_time, dict_time)

    winner_message = (
        "Smart Search is recommended for large contact lists because it finds contacts "
        "directly without checking every contact."
        if faster == "Smart Search"
        else "Normal Search completed the lookup for this contact list."
    )

    return {
        "query": query,
        "time_taken": normal_ms,
        "list_time_ms": normal_ms,
        "dict_time_ms": smart_ms,
        "list_search_time": normal_ms,
        "dictionary_search_time": smart_ms,
        "normal_search_time_ms": normal_ms,
        "smart_search_time_ms": smart_ms,
        "execution_time": {
            "normal_search_ms": normal_ms,
            "smart_search_ms": smart_ms,
        },
        "list_comparisons": list_comparisons,
        "dict_comparisons": dict_comparisons,
        "contacts_checked": list_comparisons,
        "lookups_performed": dict_comparisons,
        "faster": faster,
        "faster_method": faster,
        "best_search_method": faster,
        "list_complexity": "O(n)",
        "dict_complexity": "O(1)",
        "list_matches": list_matches,
        "dict_matches": dict_matches,
        "total_contacts": total_contacts if total_contacts is not None else len(contacts_list),
        "winner_message": winner_message,
    }


def measure_search_performance(query):
    """Benchmark list search vs dictionary lookup using time.perf_counter."""
    if not contacts_list:
        return build_timing_result(0, 0, 0, 0, query=query)

    iterations = benchmark_iterations()

    list_start = time.perf_counter()
    list_results, list_comparisons = search_list_linear(query)
    for _ in range(iterations - 1):
        list_results, list_comparisons = search_list_linear(query)
    list_time = (time.perf_counter() - list_start) / iterations

    phone_target = query
    if phone_target not in phone_index and list_results:
        phone_target = list_results[0]["phone"]

    dict_start = time.perf_counter()
    dict_results, dict_comparisons = search_dict_by_phone(phone_target)
    for _ in range(iterations - 1):
        dict_results, dict_comparisons = search_dict_by_phone(phone_target)
    dict_time = (time.perf_counter() - dict_start) / iterations

    return build_timing_result(
        list_time,
        dict_time,
        list_comparisons,
        dict_comparisons,
        query=query,
        list_matches=len(list_results),
        dict_matches=len(dict_results),
    )


def bubble_sort(numbers):
    """Bubble sort O(n^2): compare and swap adjacent elements."""
    data = list(numbers)
    length = len(data)
    for i in range(length):
        for j in range(length - i - 1):
            if data[j] > data[j + 1]:
                data[j], data[j + 1] = data[j + 1], data[j]
    return data


def merge(left, right):
    """Merge two sorted lists into one sorted list."""
    result = []
    left_index = 0
    right_index = 0
    while left_index < len(left) and right_index < len(right):
        if left[left_index] <= right[right_index]:
            result.append(left[left_index])
            left_index += 1
        else:
            result.append(right[right_index])
            right_index += 1
    result.extend(left[left_index:])
    result.extend(right[right_index:])
    return result


def merge_sort(numbers):
    """Merge sort O(n log n): divide array, sort halves, then merge."""
    if len(numbers) <= 1:
        return list(numbers)
    middle = len(numbers) // 2
    left_half = merge_sort(numbers[:middle])
    right_half = merge_sort(numbers[middle:])
    return merge(left_half, right_half)


def parse_number_array(raw_value):
    """Parse comma-separated input into a list of numbers for sorting."""
    if isinstance(raw_value, list):
        parts = raw_value
    else:
        parts = [part.strip() for part in str(raw_value).split(",") if part.strip()]

    if not parts:
        raise ValueError("Enter at least one number separated by commas.")

    numbers = []
    for part in parts:
        try:
            numbers.append(int(part) if "." not in part else float(part))
        except ValueError as exc:
            raise ValueError(f"'{part}' is not a valid number.") from exc

    return numbers


def compare_sort_algorithms(numbers):
    """Run bubble sort and merge sort on copies and return timing results."""
    bubble_data = list(numbers)
    merge_data = list(numbers)

    bubble_start = time.perf_counter()
    bubble_sorted = bubble_sort(bubble_data)
    bubble_time = time.perf_counter() - bubble_start

    merge_start = time.perf_counter()
    merge_sorted = merge_sort(merge_data)
    merge_time = time.perf_counter() - merge_start

    bubble_ms = round(bubble_time * 1000, 6)
    merge_ms = round(merge_time * 1000, 6)

    if merge_time <= bubble_time:
        faster = "Merge Sort"
        difference_ms = round((bubble_time - merge_time) * 1000, 6)
    else:
        faster = "Bubble Sort"
        difference_ms = round((merge_time - bubble_time) * 1000, 6)

    return {
        "original_array": numbers,
        "sorted_array": bubble_sorted,
        "array_size": len(numbers),
        "bubble_sort_time_ms": bubble_ms,
        "merge_sort_time_ms": merge_ms,
        "bubble_sort_execution_time": bubble_ms,
        "merge_sort_execution_time": merge_ms,
        "faster_algorithm": faster,
        "performance_difference_ms": difference_ms,
        "bubble_complexity": "O(n²)",
        "merge_complexity": "O(n log n)",
        "sorted_match": bubble_sorted == merge_sorted,
    }


def init_default_contacts():
    """Load the starter contacts when the application starts."""
    clear_contacts()
    for contact in DEFAULT_CONTACTS:
        add_contact_to_storage(
            contact["name"],
            contact["phone"],
            contact["email"],
            contact["category"],
        )


# --- Page routes ---

@app.route("/")
def dashboard():
    """Render the dashboard home page."""
    return render_template("index.html", active="dashboard")


@app.route("/add")
def add_contact_page():
    return render_template("add.html", active="add", categories=CATEGORIES)


@app.route("/contacts")
def contacts_page():
    return render_template("contacts.html", active="contacts")


@app.route("/favorites")
def favorites_page():
    """Render the favorites page."""
    return render_template("contacts.html", active="favorites")


@app.route("/search")
def search_page():
    return render_template("search.html", active="search")


@app.route("/performance")
def performance_page():
    return render_template("performance.html", active="performance")


@app.route("/sorting")
def sorting_page():
    """Render the bubble sort vs merge sort analyzer page."""
    return render_template("sorting.html", active="sorting")


# --- Contact API ---

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


# --- Search API ---

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


# --- Performance & sorting API ---

@app.route("/api/performance/search")
def api_performance_search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Search query is required"}), 400
    return jsonify(measure_search_performance(query))


@app.route("/api/sorting/compare", methods=["POST"])
def api_sorting_compare():
    """Compare bubble sort and merge sort execution times for a number array."""
    data = request.get_json(silent=True) or {}
    raw_numbers = data.get("numbers", "")

    try:
        numbers = parse_number_array(raw_numbers)
        if len(numbers) > SORT_ARRAY_MAX_SIZE:
            return jsonify({"error": f"Maximum array size is {SORT_ARRAY_MAX_SIZE} numbers."}), 400
        return jsonify(compare_sort_algorithms(numbers))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


init_default_contacts()


if __name__ == "__main__":
    # Run the development server for local testing and demos.
    app.run(debug=False, port=5001)

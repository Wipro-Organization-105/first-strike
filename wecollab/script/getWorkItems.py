import os
import json
import tempfile
from datetime import datetime, timezone
from collections import Counter
from typing import List, Dict, Any, Optional

import requests
from requests.auth import HTTPBasicAuth


AZDO_ORG = os.getenv("AZDO_ORG", "navarat")
AZDO_PROJECT = os.getenv("AZDO_PROJECT", "SDV_Solution_Team")
AZDO_PAT = os.getenv("AZDO_PAT")
AZDO_API_VERSION = os.getenv("AZDO_API_VERSION", "7.1")
DATA_DIR = os.getenv("WECOLLAB_DATA_DIR", "data")

# wiql_url = f"https://dev.azure.com/{organization}/{project}/_apis/wit/wiql?api-version=7.1"

# WORK_ITEM_TYPES = ["Epic", "User Story", "Task"]


DEFAULT_AREA_PATHS = [
    "SDV_Solution_Team\\SDV_IDE_Team",
    "SDV_Solution_Team\\HPC_Reference_Platform",
]


TEAM_MAPPING = {
    "SDV_Solution_Team\\SDV_IDE_Team": "SDV IDE Team",
    "SDV_Solution_Team\\HPC_Reference_Platform": "HPC Reference Platform",
}



# Optional filters
STATE_FILTER = None          # Example: "Active"
ASSIGNED_TO_FILTER = None    # Example: "Kamlesh Kumar Singh"
ITERATION_PATH_FILTER = None # Example: "your-project\\Sprint 1"

# query = {
#     "query": """
#     SELECT [System.Id]
#     FROM WorkItems
#     WHERE [System.WorkItemType] IN ('Epic','User Story','Task')
#     ORDER BY [System.ChangedDate] DESC
#     """
# }

def validate_env():
    missing = []
    for key, value in {
        "AZDO_ORG": AZDO_ORG,
        "AZDO_PROJECT": AZDO_PROJECT,
        "AZDO_PAT": AZDO_PAT,
    }.items():
        if not value:
            missing.append(key)

    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

def get_auth():
    if not AZDO_PAT:
        raise ValueError("AZDO_PAT environment variable is not set.")
    return HTTPBasicAuth("", AZDO_PAT)

def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    print("Data directory created")

def atomic_write_json(filename: str, payload: Dict[str, Any]) -> None:
    """
    Writes JSON atomically:
    1. write to temp file
    2. replace destination
    """
    ensure_data_dir()
    target_path = os.path.join(DATA_DIR, filename)

    with tempfile.NamedTemporaryFile("w", delete=False, dir=DATA_DIR, suffix=".tmp", encoding="utf-8") as tmp:
        json.dump(payload, tmp, indent=2)
        tmp.flush()
        os.fsync(tmp.fileno())
        tmp_path = tmp.name

    os.replace(tmp_path, target_path)

# def get_enabled_work_item_type_names() -> List[str]:
#     items = get_work_item_types()
#     return [item["name"] for item in items if not item.get("isDisabled", False)]

def get_work_item_types() -> List[Dict[str, Any]]:
    url = f"https://dev.azure.com/{AZDO_ORG}/{AZDO_PROJECT}/_apis/wit/workitemtypes?api-version={AZDO_API_VERSION}"

    response = requests.get(
        url,
        auth=get_auth(),
        headers={"Accept": "application/json"}
    )
    response.raise_for_status()
    data = response.json()

    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected work item types API response: {data}")

    value = data.get("value", [])

    
    if not isinstance(value, list):
        raise RuntimeError(f"Missing or invalid 'value' field in work item types response: {data}")

    #return response.json()
    #print(response.json())
    return value
    
    
def get_work_item_type_names() -> List[str]:
    items = get_work_item_types()

    if not isinstance(items, list):
        raise RuntimeError(f"Expected list of work item types, got: {type(items)} -> {items}")

    names = [
        item.get("name")
        for item in items
        if item.get("name") and not item.get("isDisabled", False)
    ]

    if not names:
        raise RuntimeError("No enabled work item types found from Azure DevOps.")

    return names


# def get_work_item_type_names() -> List[str]:
#     result = get_work_item_types()
    
#     if not isinstance(result, list):
#         raise Exception(f"Expected list of work item types, got: {type(result)} -> {result}")
    
#     value = result.get("value")

    
#     if not isinstance(value, list):
#         raise Exception(f"Missing or invalid 'value' field: {result}")


#     #return [item["name"] for item in result.get("value", []) if not item.get("isDisabled", False)]
    
#     return [
#         item.get("name")
#         for item in value
#         if not item.get("isDisabled", False)
#     ]




def build_wiql_query() -> str:

    area_path_condition = " OR ".join([f"[System.AreaPath] = '{path}'" for path in DEFAULT_AREA_PATHS])
    
    work_item_types = get_work_item_type_names()

    conditions = [
        f"[System.TeamProject] = '{AZDO_PROJECT}'",
        f"[System.WorkItemType] IN ({','.join([f"'{t}'" for t in work_item_types])})",
        f"({area_path_condition})"
    ]

    if STATE_FILTER:
        conditions.append(f"[System.State] = '{STATE_FILTER}'")

    if ASSIGNED_TO_FILTER:
        conditions.append(f"[System.AssignedTo] = '{ASSIGNED_TO_FILTER}'")

    if ITERATION_PATH_FILTER:
        conditions.append(f"[System.IterationPath] UNDER '{ITERATION_PATH_FILTER}'")

    wiql = f"""
    SELECT
        [System.Id]
    FROM WorkItems
    WHERE {' AND '.join(conditions)}
    ORDER BY [System.ChangedDate] DESC
    """
    return wiql.strip()


def run_wiql_query() -> List[int]:
    url = f"https://dev.azure.com/{AZDO_ORG}/{AZDO_PROJECT}/_apis/wit/wiql?api-version={AZDO_API_VERSION}"

    query = {"query": build_wiql_query()}

    response = requests.post(
        url,
        auth=get_auth(),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        json=query
    )

    response.raise_for_status()
    data = response.json()
    return [item["id"] for item in data.get("workItems", [])]
    # return response.json()


#def fetch_work_item_details(work_item_ids, batch_size=100):
def fetch_work_item_details(work_item_ids: List[int], batch_size: int = 100) -> List[Dict[str, Any]]:
    if not work_item_ids:
        return []
    
    all_items: List[Dict[str, Any]] = []

    for i in range(0, len(work_item_ids), batch_size):
        batch_ids = work_item_ids[i:i + batch_size]
        ids_param = ",".join(map(str, batch_ids))

        url = (
            f"https://dev.azure.com/{AZDO_ORG}/_apis/wit/workitems"
            f"?ids={ids_param}"
            f"&$expand=fields"
            f"&api-version={AZDO_API_VERSION}"
        )

        response = requests.get(
            url,
            auth=get_auth(),
            headers={"Accept": "application/json"}
        )
        response.raise_for_status()

        data = response.json()
        all_items.extend(data.get("value", []))

    return all_items



def normalize_work_item(item: Dict[str, Any]) -> Dict[str, Any]:
    fields = item.get("fields", {})

    assigned_to = fields.get("System.AssignedTo")
    if isinstance(assigned_to, dict):
        assigned_to = assigned_to.get("displayName")

    work_item_id = item.get("id")

    raw_area_path = fields.get("System.AreaPath")
    raw_iteration_path = fields.get("System.IterationPath")
    team = TEAM_MAPPING.get(raw_area_path, raw_area_path)
    iteration = raw_iteration_path.split("\\")[-1] if raw_iteration_path else None



    web_url = f"https://dev.azure.com/{AZDO_ORG}/{AZDO_PROJECT}/_workitems/edit/{work_item_id}"

    return {
        "id": item.get("id"),
        "title": fields.get("System.Title"),
        "workItemType": fields.get("System.WorkItemType"),
        "state": fields.get("System.State"),
        "reason": fields.get("System.Reason"),
        "assignedTo": assigned_to,
        "createdDate": fields.get("System.CreatedDate"),
        "changedDate": fields.get("System.ChangedDate"),
        "iteration": iteration,
        "team": team,
        "rawIterationPath": fields.get("System.IterationPath"),
        "rawAreaPath": fields.get("System.AreaPath"),
        "priority": fields.get("Microsoft.VSTS.Common.Priority"),
        "severity": fields.get("Microsoft.VSTS.Common.Severity"),
        "apiurl": item.get("url"),
        "webUrl": web_url
    }


def build_summary(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_state = Counter(item.get("state") or "Unknown" for item in items)
    by_assignee = Counter(item.get("assignedTo") or "Unassigned" for item in items)
    by_iteration = Counter(item.get("iterationPath") or "No Iteration" for item in items)
    by_area = Counter(item.get("areaPath") or "No AreaPath" for item in items)
    by_type = Counter(item.get("workItemType") or "Unknown" for item in items)

    return {
        "total": len(items),
        "byState": dict(by_state),
        "byAssignee": dict(by_assignee),
        "byIteration": dict(by_iteration),
        "byAreaPath": dict(by_area),
        "byWorkItemType": dict(by_type),
        "items": items,
    }


# resp = requests.post(
#     wiql_url,
#     auth=HTTPBasicAuth("", pat),
#     headers={"Content-Type": "application/json"},
#     json=query
# )

# print(resp.status_code)
# print(resp.json())


def main():
    validate_env()
    ensure_data_dir()

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    work_item_types = get_work_item_type_names()
    print(f"[INFO] Enabled work item types: {len(work_item_types)}")


    print("[INFO] Running WIQL query...")

    work_item_ids = run_wiql_query()
    print(f"[INFO] Work item IDs fetched: {len(work_item_ids)}")


    # wiql_result = run_wiql_query()

    # work_items = wiql_result.get("workItems", [])
    # work_item_ids = [w["id"] for w in work_items]

    # print(f"[INFO] Found {len(work_item_ids)} work items")

    if not work_item_ids:
        print("[INFO] No work items found")
        return

    print("[INFO] Fetching detailed work item data...")
    detailed_items = fetch_work_item_details(work_item_ids)
    normalized_items = [normalize_work_item(item) for item in detailed_items]
    summary = build_summary(normalized_items)

    work_items_payload = {
        "lastUpdated": now,
        "count": len(normalized_items),
        "value": normalized_items,
    }

    metadata_payload = {
        "lastUpdated": now,
        "project": AZDO_PROJECT,
        "organization": AZDO_ORG,
        "includedAreaPaths": DEFAULT_AREA_PATHS,
        "workItemTypeCount": len(work_item_types),
        "workItemTypes": work_item_types,
        "recordCount": len(normalized_items),
    }

    summary_payload = {
        "lastUpdated": now,
        **summary,
    }

    atomic_write_json("work_items.json", work_items_payload)
    atomic_write_json("summary.json", summary_payload)
    atomic_write_json("metadata.json", metadata_payload)

    print("[INFO] Files written successfully")

if __name__ == "__main__":
    main()





export async function fetchProjects() {
    const res = await fetch("/api/etudes");
    if (res.ok) {
      const json = await res.json();
      return json;
    } else {
      console.error("Failed to fetch projects:", res.statusText);
      return [];
    }
}

export async function createProject(data) {
    // We need to add statut: "en-cours" by default
    data.statut = "en-cours";
    const res = await fetch("/api/etudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (res.ok) {
        const json = await res.json();
        return json;
    } else {
        console.error("Failed to create project:", res.statusText);
        return null;
    }
}

export async function updateStatut(id, statut) {
    const res = await fetch(`/api/etudes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (!res.ok) throw new Error("Failed to update statut");
    const { data } = await res.json();
    return data;
  }


export async function generalUpdate(endpoint, data) {
    const res = await fetch(endpoint, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), 
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error || errorData?.message || "Failed to update information";
        throw new Error(`${errorMsg} (${res.status})`);
    }
    
    const responseData = await res.json(); 
    return responseData; 
}


export async function generalFetch(endpoint, id) {
  const res = await fetch( `${endpoint}?id=${parseInt(id, 10)}` );
  if (res.ok) {
    const json = await res.json();
    return json;
  } else {
    console.error("Failed to fetch data from " + endpoint + ":", res.statusText);
    return null;
  }
}
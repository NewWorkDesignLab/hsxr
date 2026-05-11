export interface Lobby {
    join_code: string;
    creator: string;
    created_at: string;
    player_count?: number;
    max_players?: number;
}

function apiBase(): string {
    return "/api";
}

export async function fetchLobbies(): Promise<Lobby[]> {
    const res = await fetch(`${apiBase()}/get-lobbies`, { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`lobbies failed: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}


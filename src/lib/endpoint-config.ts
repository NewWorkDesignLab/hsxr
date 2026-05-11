import yaml from "js-yaml";
import fs from "node:fs";
import path from "node:path";

interface EndpointsConfig {
    api: {
        base_url: string;
        prefix: string;
    };
}

let config: EndpointsConfig | null = null;

function loadConfig(): EndpointsConfig {
    if (config) return config;
    const p = path.resolve(process.cwd(), "endpoints.yaml");
    config = yaml.load(fs.readFileSync(p, "utf8")) as EndpointsConfig;
    return config;
}

export function getApiUrl(): string {
    const { api } = loadConfig();
    return `${api.base_url}${api.prefix}`;
}


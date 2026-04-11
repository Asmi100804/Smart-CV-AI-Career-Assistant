import dotenv from "dotenv";
dotenv.config();
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function mcp__supabase__execute_sql(query: string): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env");
  }

  const postgrestUrl = `${url}/rest/v1/rpc/exec_sql`;

  const response = await fetch(postgrestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase SQL execution failed: ${response.status} - ${errorText}`);
  }
}

export async function mcp__supabase__query_sql<T = any>(query: string): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env");
  }

  const postgrestUrl = `${url}/rest/v1/rpc/exec_sql`;

  const response = await fetch(postgrestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase SQL query failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return Array.isArray(result) ? result : [];
}

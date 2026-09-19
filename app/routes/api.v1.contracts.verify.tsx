import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getCredentialByKey, verifyContract } from "../ribbit.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: cors });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  return json({ error: "Use POST" }, 405);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return json({ valid: false, reason: "unauthorized" }, 401);
  }

  const credential = await getCredentialByKey(token);
  if (!credential) {
    return json({ valid: false, reason: "invalid_api_key" }, 401);
  }

  let body: { license_key?: string; email?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = await verifyContract({
    shop: credential.shop,
    licenseKey: body.license_key,
    email: body.email,
  });

  return json(result, result.valid ? 200 : 404);
};

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUsername || !passwordHash) {
    console.error("ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not configured");
    return NextResponse.json(
      { error: "Admin login is not configured" },
      { status: 500 }
    );
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  // Always run the hash comparison, even on a username mismatch, so the
  // response time doesn't leak whether the username exists.
  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  const isUsernameValid = username === expectedUsername;

  if (!isUsernameValid || !isPasswordValid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }

  await createSession(username);
  return NextResponse.json({ ok: true });
}

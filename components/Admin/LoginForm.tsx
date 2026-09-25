"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm border border-stone-200 bg-white p-8"
    >
      <h1 className="mb-6 text-lg font-medium text-stone-900">Admin sign in</h1>

      <div className="mb-4">
        <label
          htmlFor="username"
          className="mb-1.5 block text-sm text-stone-600"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm text-stone-600"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500"
        />
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-stone-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

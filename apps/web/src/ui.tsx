import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuthStore } from "./authStore";

export function Shell({ children }: { children: ReactNode }) {
  const { accessToken, clear } = useAuthStore();
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Personal Expense Tracker
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {accessToken ? (
              <>
                <TopNav to="/expenses" label="Expenses" />
                <TopNav to="/categories" label="Categories" />
                <TopNav to="/reports" label="Reports" />
                <button
                  className="rounded-md border border-slate-700 px-3 py-1.5 hover:bg-slate-900"
                  onClick={clear}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <TopNav to="/login" label="Log in" />
                <TopNav to="/signup" label="Sign up" />
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}

function TopNav({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 hover:bg-slate-900 ${isActive ? "bg-slate-900" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-500 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-500 ${props.className ?? ""}`}
    />
  );
}

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-white disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

export function DangerButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-900 disabled:opacity-60 ${props.className ?? ""}`}
    />
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-100">
      {message}
    </div>
  );
}


import { Link } from "react-router-dom";
import { useAuthStore } from "../authStore";
import { Card } from "../ui";

export function HomePage() {
  const token = useAuthStore((s) => s.accessToken);
  return (
    <div className="grid gap-4">
      <Card title="Welcome">
        <p className="text-sm text-slate-300">
          Track expenses, manage categories, and view simple reports.
        </p>
        <div className="mt-3 flex gap-2">
          {token ? (
            <Link className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-white" to="/expenses">
              Go to expenses
            </Link>
          ) : (
            <>
              <Link className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-white" to="/login">
                Log in
              </Link>
              <Link className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900" to="/signup">
                Sign up
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}


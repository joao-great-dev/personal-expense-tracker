import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuthStore } from "../authStore";
import { Button, Card, ErrorBanner, Field, Input } from "../ui";

export function SignupPage() {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.signup({ email, password });
      setSession({ accessToken: res.accessToken, email: res.email, userId: res.userId });
      nav("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-md gap-4">
      <Card title="Sign up">
        <form className="grid gap-3" onSubmit={onSubmit}>
          {error ? <ErrorBanner message={error} /> : null}
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password (min 8 chars)">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
          </Field>
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
      </Card>
    </div>
  );
}


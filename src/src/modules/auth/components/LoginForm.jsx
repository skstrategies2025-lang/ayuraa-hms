import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import SummaryApi, { callApi, getSession, setSession, HMS_PORTAL } from "@/common";

export default function LoginForm() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // already signed in -> go straight to the portal
  useEffect(() => {
    if (getSession()) navigate("/hms/dashboard", { replace: true });
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    const id = identifier.trim();
    if (!id) return setError("Enter your User ID");
    if (!password) return setError("Enter your password");

    setLoading(true);
    try {
      // Login answer: { success, message, data: { user, redirectTo } }
      const res = await callApi(SummaryApi.Login, { identifier: id, password, portal: HMS_PORTAL });
      const user = res?.data?.user;
      if (!user) throw new Error("Invalid response from login server");

      setSession({
        id: user.id,
        userId: user.userId ?? user.user_id ?? id,
        name: user.name,
        portal: user.portal ?? HMS_PORTAL,
        staffRole: user.staffRole ?? user.staff_role,
        hospitalId: user.hospitalId ?? user.hospital_id,
        branchId: user.branchId ?? user.branch_id,
        loggedInAt: new Date().toISOString(),
      });
      navigate("/hms/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-sm font-semibold text-slate-800">User ID</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-700" />
          <input
            id="identifier"
            type="text"
            className="input"
            placeholder="Enter your User ID"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-700" />
          <input
            id="password"
            type={showPw ? "text" : "password"}
            className="input pr-11"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-700"
          >
            {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full !py-[15px]">
        {loading ? "Signing in…" : "Login"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

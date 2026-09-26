import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('admin@forgesoc.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-forge-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-2xl font-bold tracking-tight text-forge-text">
            FORGE<span className="text-forge-accent">SOC</span>
          </div>
          <div className="text-xs text-forge-muted font-mono mt-2 tracking-widest">
            SECURITY OPERATIONS CENTER
          </div>
        </div>

        <form onSubmit={handleSubmit} className="panel p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-forge-bg border border-forge-border rounded-sm px-3 py-2 text-sm text-forge-text focus:border-forge-accent outline-none"
            />
          </div>

          {error && (
            <div className="text-xs font-mono text-forge-critical border border-forge-critical/40 bg-forge-critical/10 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-forge-accent/15 border border-forge-accent/40 text-forge-accent font-mono text-sm py-2.5 rounded-sm hover:bg-forge-accent/25 transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>

          <p className="text-xs text-forge-muted text-center font-mono">
            Seed login: admin@forgesoc.local / Password123!
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

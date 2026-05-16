import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg shadow-primary-500/40 mb-4">
            <span className="text-3xl">🍔</span>
          </div>
          <h2 className="text-3xl font-bold text-white">FoodAdmin</h2>
          <p className="text-white/60 mt-1">Sign in to your dashboard</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6 p-3 bg-primary-500/20 border border-primary-500/30 rounded-xl">
            <p className="text-sm text-primary-200 text-center">
              <strong>Credentials:</strong> admin@nds.com / admin1234
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                placeholder="Email address"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
            </div>

            {error && (
              <div className="text-red-300 text-sm text-center bg-red-500/20 border border-red-500/30 rounded-lg py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
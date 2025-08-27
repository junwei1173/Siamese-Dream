import { useEffect, useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import axios from "axios";
import API_URL from '../config/api';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_dreams: 0,
    lucid_dreams: 0,
    avg_mood: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch user statistics
    fetchUserStats();
  }, [user, navigate]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/${user.id}/profile`);
      const statistics = response.data.statistics;
      
      setStats({
        total_dreams: statistics.total_dreams || 0,
        lucid_dreams: statistics.lucid_dreams || 0,
        avg_mood: statistics.avg_mood ? parseFloat(statistics.avg_mood).toFixed(1) : 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Keep default values if there's an error
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        color: 'white'
      }}>
        <img 
          src="/siameselogo.png" 
          alt="Logo" 
          style={{
            width: '80px',
            height: '80px',
            marginBottom: '1rem',
            objectFit: 'contain'
          }}
        />
        <h1 style={{
          fontSize: '2.5rem',
          margin: '0 0 0.5rem 0',
          fontWeight: '300',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Welcome back, {user.username}
        </h1>
        <p style={{
          fontSize: '1.2rem',
          margin: 0,
          opacity: '0.9'
        }}>
          Your dream world awaits exploration
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Action Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <Link to="/create-dream" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>Write a Dream</h3>
              <p style={{ margin: 0, opacity: '0.9' }}>Capture your latest dream journey</p>
            </div>
          </Link>

          <Link to="/mydreams" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(145deg, #4ecdc4, #44a08d)',
              borderRadius: '20px',
              padding: '2rem',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>My Dreams</h3>
              <p style={{ margin: 0, opacity: '0.9' }}>Browse your dream collection</p>
            </div>
          </Link>
        </div>

        {/* Stats Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 1.5rem 0',
            fontSize: '1.5rem',
            textAlign: 'center'
          }}>
            Dream Statistics
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
              Loading your dream statistics...
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1.5rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '2rem', color: '#ffd93d', marginBottom: '0.5rem' }}>🌙</div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {stats.total_dreams}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Total Dreams</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', color: '#ff6b9d', marginBottom: '0.5rem' }}>💫</div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {stats.lucid_dreams}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Lucid Dreams</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', color: '#4ecdc4', marginBottom: '0.5rem' }}>😊</div>
                <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {stats.avg_mood}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Avg Mood</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

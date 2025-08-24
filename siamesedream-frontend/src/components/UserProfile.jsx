import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API_URL from '../config/api';

function UserProfile() {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        console.log('URL params:', { userId });
        console.log('Fetching profile for user ID:', userId);
        
        // Check if userId is valid
        if (!userId || userId === 'undefined') {
          throw new Error('Invalid user ID in URL');
        }
        
        const response = await fetch(`${API_URL}/users/${userId}/profile`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Profile data received:', data);
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch profile data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId && userId !== 'undefined') {
      fetchProfileData();
    } else {
      setError('No valid user ID provided in URL');
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  if (!profileData) {
    return <div>No profile data found.</div>;
  }

  const { user, statistics, topSymbols, dreamFrequency, recentDreams } = profileData;

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
      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem'
      }}></div>
      <h1 style={{
        fontSize: '2.5rem',
        margin: '0 0 0.5rem 0',
        fontWeight: '300',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        @{user.username}
      </h1>
      <p style={{
        fontSize: '1.2rem',
        margin: 0,
        opacity: '0.9'
      }}>
        Dream Journal Profile
      </p>
    </div>

    {/* Main Content */}
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Statistics Grid */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.2)',
        marginBottom: '3rem'
      }}>
        <h3 style={{
          color: 'white',
          margin: '0 0 2rem 0',
          fontSize: '1.5rem',
          textAlign: 'center'
        }}>
          Dream Statistics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '2.5rem', color: '#ffd93d', marginBottom: '0.5rem' }}></div>
            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {statistics.total_dreams || 0}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Total Dreams</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2.5rem', color: '#ff6b9d', marginBottom: '0.5rem' }}></div>
            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {statistics.lucid_dreams || 0}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Lucid Dreams</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2.5rem', color: '#4ecdc4', marginBottom: '0.5rem' }}></div>
            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {statistics.avg_mood ? parseFloat(statistics.avg_mood).toFixed(1) : 'N/A'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Avg Mood</div>
          </div>
          
          <div>
            <div style={{ fontSize: '2.5rem', color: '#a8e6cf', marginBottom: '0.5rem' }}></div>
            <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {statistics.first_dream_date ? 
                Math.floor((new Date() - new Date(statistics.first_dream_date)) / (1000 * 60 * 60 * 24)) 
                : 0}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Days Journaling</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {/* Top Symbols */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}></div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>Most Common Symbols</h3>
          </div>
          {topSymbols.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {topSymbols.map((symbol, index) => (
                <span
                  key={index}
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  #{symbol.name} ({symbol.frequency})
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>No symbols recorded yet.</p>
          )}
        </div>

        {/* Dream Frequency */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}></div>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>Dream Frequency</h3>
          </div>
          {dreamFrequency.length > 0 ? (
            <div>
              {dreamFrequency.map((freq, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {new Date(freq.month).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>
                    {freq.dream_count} dreams
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>No recent dreams to show.</p>
          )}
        </div>
      </div>

      {/* Recent Dreams */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.2)',
        marginBottom: '3rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}></div>
          <h3 style={{ color: 'white', margin: 0, fontSize: '1.3rem' }}>Recent Dreams</h3>
        </div>
        {recentDreams.length > 0 ? (
          <div>
            {recentDreams.map((dream) => (
              <div key={dream.id} style={{ 
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '15px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(5px)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '1rem' 
                }}>
                  <h4 style={{ margin: '0', color: 'white', fontSize: '1.2rem' }}>
                    {dream.title || "Untitled Dream"}
                    {dream.is_lucid && <span style={{ color: '#ffd93d', marginLeft: '0.5rem' }}>☁️</span>}
                  </h4>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                    {new Date(dream.dream_date).toLocaleDateString()}
                  </span>
                </div>
                
                <p style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  lineHeight: '1.6',
                  marginBottom: '1rem',
                  fontSize: '0.95rem'
                }}>
                  {dream.content.length > 200 ? 
                    dream.content.substring(0, 200) + "..." : 
                    dream.content
                  }
                </p>
                
                {dream.symbols && dream.symbols.length > 0 && dream.symbols[0] !== null && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {dream.symbols.filter(s => s !== null).map((symbol, index) => (
                      <span
                        key={index}
                        style={{
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          color: 'white',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '15px',
                          fontSize: '0.8rem',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        #{symbol}
                      </span>
                    ))}
                  </div>
                )}
                
                <div>
                  <Link
                    to={`/mydreams/`}
                    style={{
                      background: 'linear-gradient(145deg, #4ecdc4, #44a08d)',
                      color: 'white',
                      textDecoration: 'none',
                      padding: '0.6rem 1.5rem',
                      borderRadius: '25px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    More Info →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>No dreams recorded yet.</p>
        )}
      </div>

      {/* Back to Feed */}
      <div style={{ textAlign: 'center' }}>
        <Link 
          to="/feed"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
            color: 'white',
            textDecoration: 'none',
            padding: '1rem 3rem',
            borderRadius: '30px',
            fontSize: '1.1rem',
            fontWeight: '500',
            display: 'inline-block',
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back to Dream Feed
        </Link>
      </div>
    </div>
  </div>
);
}

export default UserProfile;

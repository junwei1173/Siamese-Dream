import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./AuthContext";

import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Dashboard from "./components/Dashboard";
import CreateDream from "./components/CreateDream";
import MyDreams from "./components/MyDreams";
import DreamFeed from './components/DreamFeed';
import UserProfile from './components/UserProfile';
import DreamAnalysis from './components/DreamAnalysis';

function NavBar() {
  const { user, logout } = useContext(AuthContext);

  const navLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    fontSize: '0.95rem',
    fontWeight: '500',
    display: 'inline-block'
  };

  const navButtonStyle = {
    background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
    border: 'none',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(238, 90, 82, 0.3)'
  };

  const handleLinkHover = (e, isEnter) => {
    if (isEnter) {
      e.target.style.background = 'rgba(255,255,255,0.15)';
      e.target.style.transform = 'translateY(-2px)';
    } else {
      e.target.style.background = 'transparent';
      e.target.style.transform = 'translateY(0)';
    }
  };

  const handleButtonHover = (e, isEnter) => {
    if (isEnter) {
      e.target.style.background = 'linear-gradient(145deg, #ee5a52, #dc4c41)';
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 6px 20px rgba(238, 90, 82, 0.4)';
    } else {
      e.target.style.background = 'linear-gradient(145deg, #ff6b6b, #ee5a52)';
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 4px 15px rgba(238, 90, 82, 0.3)';
    }
  };

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem 2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo and Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>
          <img 
            src="/siameselogo.png" 
            alt="Siamese Dream Logo" 
            style={{
              width: '40px',
              height: '40px',
              marginRight: '0.75rem',
              objectFit: 'contain'
            }}
          />
          Siamese Dream
        </div>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {user ? (
            <>
              <div style={{
                color: 'rgba(255,255,255,0.9)',
                marginRight: '1rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.95rem'
              }}>
                Welcome, <strong>{user.username}</strong>
              </div>
              
              <Link 
                to="/dashboard" 
                style={navLinkStyle}
                onMouseEnter={(e) => handleLinkHover(e, true)}
                onMouseLeave={(e) => handleLinkHover(e, false)}
              >
                Dashboard
              </Link>
              
              <Link 
                to={`/users/${user.id}`} 
                style={navLinkStyle}
                onMouseEnter={(e) => handleLinkHover(e, true)}
                onMouseLeave={(e) => handleLinkHover(e, false)}
              >
                My Profile
              </Link>

              <Link 
                to="/mydreams"
                style={navLinkStyle}
                onMouseEnter={(e) => handleLinkHover(e, true)}
                onMouseLeave={(e) => handleLinkHover(e, false)}
              >
                My Dreams
              </Link>
              
              <Link 
                to="/dream-analysis" 
                style={navLinkStyle}
                onMouseEnter={(e) => handleLinkHover(e, true)}
                onMouseLeave={(e) => handleLinkHover(e, false)}
              >
                Dream Analysis
              </Link>
              
              <Link 
                to="/feed" 
                style={navLinkStyle}
                onMouseEnter={(e) => handleLinkHover(e, true)}
                onMouseLeave={(e) => handleLinkHover(e, false)}
              >
                Community Feed
              </Link>
              
              <button 
                onClick={logout} 
                style={navButtonStyle}
                onMouseEnter={(e) => handleButtonHover(e, true)}
                onMouseLeave={(e) => handleButtonHover(e, false)}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                style={navLinkStyle}
                onMouseEnter={(e) => handleLinkHover(e, true)}
                onMouseLeave={(e) => handleLinkHover(e, false)}
              >
                Login
              </Link>
              
              <Link 
                to="/register" 
                style={{
                  ...navLinkStyle,
                  background: 'linear-gradient(145deg, #4ecdc4, #44a08d)',
                  boxShadow: '0 4px 15px rgba(68, 160, 141, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, #44a08d, #3d8b7a)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(68, 160, 141, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(145deg, #4ecdc4, #44a08d)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(68, 160, 141, 0.3)';
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <NavBar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/create-dream" element={<CreateDream />} />
            <Route path="/mydreams" element={<MyDreams />} />
            <Route path="/feed" element={<DreamFeed />} />
            <Route path="/users/:userId" element={<UserProfile />} />
            <Route path="/dream-analysis" element={<DreamAnalysis />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
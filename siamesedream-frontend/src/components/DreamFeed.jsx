import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { useCallback } from "react";
import API_URL from '../config/api';

function DreamFeed() {
  const [dreams, setDreams] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLucidFilter, setIsLucidFilter] = useState("");
  const [moodMin, setMoodMin] = useState("");
  const [moodMax, setMoodMax] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);


  const fetchPopularSymbols = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051';
      const response = await fetch(`${API_URL}/symbols/popular`);
      if (response.ok) {
        const data = await response.json();
        setPopularSymbols(data);
      }
    } catch (err) {
      console.error('Failed to fetch popular symbols:', err);
    }
  };

 const fetchDreams = useCallback(async (append = false) => {
  try {
    if (!append) setLoading(true);
    setLoadingMore(append);

    const offset = append ? dreams.length : 0;

    const params = new URLSearchParams();
    params.set("limit", 6);
    params.set("offset", offset);
    if (selectedSymbol) params.set("symbol", selectedSymbol);
    if (searchQuery.trim()) params.set("query", searchQuery.trim());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (isLucidFilter !== "") params.set("is_lucid", isLucidFilter);
    if (moodMin) params.set("mood_min", moodMin);
    if (moodMax) params.set("mood_max", moodMax);

    const response = await fetch(`http://localhost:5051/feed?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch dreams.");

    const data = await response.json();
    if (append) {
      setDreams(prev => [...prev, ...data]);
    } else {
      setDreams(data);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
}, [
  dreams.length,
  selectedSymbol,
  searchQuery,
  dateFrom,
  dateTo,
  isLucidFilter,
  moodMin,
  moodMax
]);

useEffect(() => {
  fetchPopularSymbols()
  fetchDreams();
}, [fetchDreams]);




  const loadMore = () => {
    fetchDreams(true);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      Loading dream feed...
    </div>
  );
  
  if (error) return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "auto", 
      padding: "1rem",
      color: 'red',
      textAlign: "center"
    }}>
      {error}
    </div>
  );

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
        Community Dream Feed
      </h1>
      <p style={{
        fontSize: '1.2rem',
        margin: 0,
        opacity: '0.9'
      }}>
        Explore dreams shared by the community
      </p>
    </div>

    {/* Main Content */}
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Search Section */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.2)',
        marginBottom: '3rem'
      }}>
        {/* Main Search Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                placeholder="Search community dreams... (content, titles, themes)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  borderRadius: '30px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.6)';
                  e.target.style.background = 'rgba(255,255,255,0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                }}
              />
            </div>
            
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{
                padding: '1rem 2rem',
                background: showAdvancedSearch 
                  ? 'linear-gradient(145deg, #4ecdc4, #44a08d)'
                  : 'linear-gradient(145deg, #6c757d, #5a6268)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '30px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              {showAdvancedSearch ? ' Hide Filters' : ' Advanced'}
            </button>
          </div>
        </div>

        {/* Advanced Search Filters */}
        {showAdvancedSearch && (
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.2)', 
            paddingTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Symbol Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                fontSize: '0.95rem',
                color: 'white'
              }}>
                 Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="" style={{color: '#333'}}>All Symbols</option>
                {popularSymbols.map(symbol => (
                  <option key={symbol.name} value={symbol.name} style={{color: '#333'}}>
                    {symbol.name} ({symbol.dream_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                fontSize: '0.95rem',
                color: 'white'
              }}>
                 From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>

            {/* Date To */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                fontSize: '0.95rem',
                color: 'white'
              }}>
                 To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>

            {/* Lucid Filter */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                fontSize: '0.95rem',
                color: 'white'
              }}>
                 Dream Type
              </label>
              <select
                value={isLucidFilter}
                onChange={(e) => setIsLucidFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="" style={{color: '#333'}}>All Dreams</option>
                <option value="true" style={{color: '#333'}}>Lucid Only</option>
                <option value="false" style={{color: '#333'}}>Non-Lucid Only</option>
              </select>
            </div>

            {/* Mood Range */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                fontSize: '0.95rem',
                color: 'white'
              }}>
                 Min Mood
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={moodMin}
                onChange={(e) => setMoodMin(e.target.value)}
                placeholder="1-10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600', 
                fontSize: '0.95rem',
                color: 'white'
              }}>
                 Max Mood
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={moodMax}
                onChange={(e) => setMoodMax(e.target.value)}
                placeholder="1-10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchQuery || selectedSymbol || dateFrom || dateTo || isLucidFilter !== "" || moodMin || moodMax) && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(5px)',
            borderRadius: '15px',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: '600', color: 'white', fontSize: '1rem' }}>Active Filters:</span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSymbol("");
                  setDateFrom("");
                  setDateTo("");
                  setIsLucidFilter("");
                  setMoodMin("");
                  setMoodMax("");
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {searchQuery && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>Text: "{searchQuery}"</span>}
              {selectedSymbol && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>Symbol: {selectedSymbol}</span>}
              {dateFrom && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>From: {dateFrom}</span>}
              {dateTo && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>To: {dateTo}</span>}
              {isLucidFilter !== "" && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>{isLucidFilter === "true" ? "Lucid Only" : "Non-Lucid Only"}</span>}
              {moodMin && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>Mood ≥ {moodMin}</span>}
              {moodMax && <span style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '15px', fontSize: '0.85rem', color: 'white', backdropFilter: 'blur(5px)' }}>Mood ≤ {moodMax}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Dreams List */}
      {dreams.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '3rem',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
          <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem' }}>No dreams found</h3>
          {selectedSymbol ? (
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              No dreams found with the symbol "{selectedSymbol}". Try a different filter or check back later!
            </p>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              The dream feed is empty. Be the first to share your dreams with the community!
            </p>
          )}
          <Link 
            to="/create-dream"
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(145deg, #4ecdc4, #44a08d)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '30px',
              display: 'inline-block',
              fontWeight: '600',
              fontSize: '1.1rem',
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              transition: 'transform 0.3s ease'
            }}
          >
            ✨ Share Your Dream
          </Link>
        </div>
      ) : (
        <>
          {/* Dreams Grid */}
          <div style={{ 
            display: 'grid', 
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {dreams.map((dream) => (
              <div 
                key={dream.id} 
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  padding: '2rem',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
                }}
              >
                {/* Dream Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <h3 style={{ 
                    margin: '0', 
                    color: 'white',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '1.3rem',
                    minWidth: '200px'
                  }}>
                    {dream.title || "Untitled Dream"}
                    {dream.is_lucid && <span style={{ color: '#ffd93d' }}>💫</span>}
                  </h3>
                  
                  <div style={{ 
                    textAlign: 'right', 
                    fontSize: '0.9rem', 
                    color: 'rgba(255,255,255,0.8)',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1rem',
                    borderRadius: '15px',
                    backdropFilter: 'blur(5px)',
                    minWidth: '200px'
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <Link 
                        to={`/users/${dream.user_id}`}
                        style={{ 
                          textDecoration: 'none', 
                          color: '#4ecdc4', 
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}
                      >
                        @{dream.username}
                      </Link>
                    </div>
                    <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                       {new Date(dream.dream_date).toLocaleDateString()}
                    </div>
                    {dream.mood_score && (
                      <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                         Mood: {dream.mood_score}/10
                      </div>
                    )}
                    {dream.sleep_duration && (
                      <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                         Slept: {dream.sleep_duration}h
                      </div>
                    )}
                    {dream.sleep_quality && (
                      <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                         Quality: {dream.sleep_quality}/10
                      </div>
                    )}
                    {dream.bedtime && (
                      <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                         Bedtime: {new Date(`1970-01-01T${dream.bedtime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    )}
                    {dream.sleep_disruptions && dream.sleep_disruptions.length > 0 && (
                      <div style={{ fontSize: '0.85rem' }}>
                         Issues: {dream.sleep_disruptions.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dream Content */}
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(5px)',
                  borderRadius: '15px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <p style={{ 
                    lineHeight: '1.7', 
                    color: 'rgba(255,255,255,0.95)',
                    margin: '0',
                    fontSize: '1rem'
                  }}>
                    {dream.content.length > 300 ? 
                      dream.content.substring(0, 300) + "..." : 
                      dream.content
                    }
                  </p>
                </div>
                
                {/* Symbols */}
                {dream.symbols && dream.symbols.length > 0 && dream.symbols[0] !== null && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      fontSize: '0.95rem', 
                      fontWeight: '600', 
                      color: 'white',
                      marginRight: '0.5rem'
                    }}>
                      Symbols:
                    </span>
                    {dream.symbols.filter(s => s !== null).map((symbol, index) => (
                      <span
                        key={index}
                        onClick={() => setSelectedSymbol(symbol === selectedSymbol ? "" : symbol)}
                        style={{
                          background: selectedSymbol === symbol ? 
                            'linear-gradient(145deg, #4ecdc4, #44a08d)' : 
                            'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontWeight: selectedSymbol === symbol ? '600' : '500',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backdropFilter: 'blur(5px)',
                          boxShadow: selectedSymbol === symbol ? '0 4px 15px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        #{symbol}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More Button */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                padding: '1rem 3rem',
                background: loadingMore ? 
                  'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))' : 
                  'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '30px',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                opacity: loadingMore ? 0.7 : 1,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {loadingMore ? '✨ Loading...' : ' Load More Dreams'}
            </button>
          </div>

          {/* Community Stats */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.2)',
            marginBottom: '3rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}></div>
              <h3 style={{ margin: '0', color: 'white', fontSize: '1.5rem' }}>Community Insights</h3>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '2rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '2.5rem', color: '#4ecdc4', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                  {dreams.length}+
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Dreams Shared</div>
              </div>
              
              <div>
                <div style={{ fontSize: '2.5rem', color: '#ffd93d', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                  {dreams.filter(d => d.is_lucid).length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Lucid Dreams</div>
              </div>
              
              <div>
                <div style={{ fontSize: '2.5rem', color: '#ff6b9d', marginBottom: '0.5rem' }}></div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                  {popularSymbols.length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Active Symbols</div>
              </div>
              
              <div>
                <div style={{ fontSize: '2.5rem', color: '#a8e6cf', marginBottom: '0.5rem' }}>👥</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                  {new Set(dreams.map(d => d.username)).size}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Dream Journalers</div>
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div style={{ 
            textAlign: 'center',
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              to="/create-dream"
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(145deg, #4ecdc4, #44a08d)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '30px',
                fontWeight: '600',
                display: 'inline-block',
                fontSize: '1rem',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s ease'
              }}
            >
               Share Your Dream
            </Link>
            
            {user && (
              <>
                <button
                  onClick={() => navigate("/mydreams")}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                   My Dreams
                </button>
                
                <button
                  onClick={() => navigate(`/users/${user.id}`)}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                   My Profile
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);
}

export default DreamFeed;

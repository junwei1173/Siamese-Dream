import { useState, useEffect, useContext, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

function MyDreams() {
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSymbol, setFilterSymbol] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLucidFilter, setIsLucidFilter] = useState("");
  const [moodMin, setMoodMin] = useState("");
  const [moodMax, setMoodMax] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  
  // Pagination and search state
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const performSearch = useCallback(async (customParams = {}) => {
    if (!user) return;

    try {
      setIsSearching(true);
      
      // Build search parameters
      const params = new URLSearchParams({
        user_id: user.id,
        limit: 50,
        offset: 0,
        ...customParams
      });

      // Add search filters
      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      if (filterSymbol) params.set('symbols', filterSymbol);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (isLucidFilter !== "") params.set('is_lucid', isLucidFilter);
      if (moodMin) params.set('mood_min', moodMin);
      if (moodMax) params.set('mood_max', moodMax);

      const response = await fetch(`${API_URL}/dreams/search?${params}`);;

      if (!response.ok) {
        throw new Error('Failed to search dreams');
      }

      const data = await response.json();
      
      // Apply client-side sorting since backend returns by relevance/date
      let sortedDreams = [...data.dreams];
      switch (sortBy) {
        case "title":
          sortedDreams.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
          break;
        case "mood":
          sortedDreams.sort((a, b) => (b.mood_score || 0) - (a.mood_score || 0));
          break;
        case "date":
        default:
          // Already sorted by date from backend
          break;
      }

      setDreams(sortedDreams);
      setDreams(sortedDreams);
console.log('=== DREAMS DATA DEBUG ===');
console.log('Raw API response:', data);
console.log('First dream full object:', data.dreams[0]);
console.log('Sleep data check:', {
  sleep_duration: data.dreams[0]?.sleep_duration,
  sleep_quality: data.dreams[0]?.sleep_quality,
  bedtime: data.dreams[0]?.bedtime,
  sleep_disruptions: data.dreams[0]?.sleep_disruptions,
  mood_score: data.dreams[0]?.mood_score
});
console.log('=== END DEBUG ===');
      setTotalResults(data.total);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [user, searchQuery, filterSymbol, dateFrom, dateTo, isLucidFilter, moodMin, moodMax, sortBy]);

  

 

  // Initial load
  useEffect(() => {
    if (!user) {
      setError("Please log in to see your dreams.");
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        await performSearch();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, performSearch]);

  // Trigger search when filters change (debounced)
useEffect(() => {
  if (!user || loading) return;

  const handler = setTimeout(() => {
    performSearch();
  }, 300);

  return () => {
    clearTimeout(handler);
  };
}, [
  performSearch,
  searchQuery,
  filterSymbol,
  dateFrom,
  dateTo,
  isLucidFilter,
  moodMin,
  moodMax,
  sortBy,
  user,
  loading,
]);

  const handleDelete = async (dreamId) => {
    if (!window.confirm("Are you sure you want to delete this dream? This action cannot be undone.")) {
      return;
    }

    setDeleteLoading(dreamId);

    try {
      const response = await fetch(
        `${API_URL}/dreams/${dreamId}?user_id=${user.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete dream');
      }

      setDreams(dreams.filter(dream => dream.id !== dreamId));
      setTotalResults(prev => prev - 1);
      
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterSymbol("");
    setDateFrom("");
    setDateTo("");
    setIsLucidFilter("");
    setMoodMin("");
    setMoodMax("");
    setSortBy("date");
  };

  // Get unique symbols for filter dropdown
  const allSymbols = [...new Set(
    dreams.flatMap(dream => dream.symbols?.filter(s => s !== null) || [])
  )].sort();

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Loading your dreams...</div>;
  
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
      }}>🌙</div>
      <h1 style={{
        fontSize: '2.5rem',
        margin: '0 0 0.5rem 0',
        fontWeight: '300',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        Your Dream Journal
      </h1>
      <p style={{
        fontSize: '1.2rem',
        margin: 0,
        opacity: '0.9'
      }}>
        {totalResults} {totalResults === 1 ? 'dream' : 'dreams'} 
        {(searchQuery || filterSymbol || dateFrom || dateTo || isLucidFilter !== "" || moodMin || moodMax) 
          ? ' found' : ' recorded'}
      </p>
    </div>

    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Search Section */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Main Search Bar */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                placeholder="Search your dreams... (content, titles, themes)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem 1.5rem",
                  borderRadius: "25px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.5)";
                  e.target.style.boxShadow = "0 0 20px rgba(255,255,255,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.3)";
                  e.target.style.boxShadow = "none";
                }}
              />
              {isSearching && (
                <div style={{
                  position: "absolute",
                  right: "1.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.8)"
                }}>
                  🔍
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{
                padding: "1rem 1.5rem",
                background: showAdvancedSearch 
                  ? 'linear-gradient(145deg, #4ecdc4, #44a08d)'
                  : 'linear-gradient(145deg, #6c757d, #5a6268)',
                color: "white",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "600",
                whiteSpace: "nowrap",
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
              }}
            >
              {showAdvancedSearch ? " Hide Filters" : " Advanced"}
            </button>
          </div>
        </div>

        {/* Advanced Search Filters */}
        {showAdvancedSearch && (
          <div style={{ 
            borderTop: "1px solid rgba(255,255,255,0.2)", 
            paddingTop: "2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem"
          }}>
            {/* Symbol Filter */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.75rem", 
                fontWeight: "600", 
                fontSize: "1rem",
                color: "white"
              }}>
                🏷️ Symbol
              </label>
              <select
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <option value="">All Symbols</option>
                {allSymbols.map(symbol => (
                  <option key={symbol} value={symbol} style={{color: '#333'}}>{symbol}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.75rem", 
                fontWeight: "600", 
                fontSize: "1rem",
                color: "white"
              }}>
                📅 From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </div>

            {/* Date To */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.75rem", 
                fontWeight: "600", 
                fontSize: "1rem",
                color: "white"
              }}>
                📅 To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </div>

            {/* Lucid Filter */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.75rem", 
                fontWeight: "600", 
                fontSize: "1rem",
                color: "white"
              }}>
                 Dream Type
              </label>
              <select
                value={isLucidFilter}
                onChange={(e) => setIsLucidFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <option value="">All Dreams</option>
                <option value="true" style={{color: '#333'}}>Lucid Only</option>
                <option value="false" style={{color: '#333'}}>Non-Lucid Only</option>
              </select>
            </div>

            {/* Mood Range */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.75rem", 
                fontWeight: "600", 
                fontSize: "1rem",
                color: "white"
              }}>
                😊 Min Mood
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={moodMin}
                onChange={(e) => setMoodMin(e.target.value)}
                placeholder="1-10"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.75rem", 
                fontWeight: "600", 
                fontSize: "1rem",
                color: "white"
              }}>
                😊 Max Mood
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={moodMax}
                onChange={(e) => setMoodMax(e.target.value)}
                placeholder="1-10"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchQuery || filterSymbol || dateFrom || dateTo || isLucidFilter !== "" || moodMin || moodMax) && (
          <div style={{ 
            marginTop: "2rem", 
            padding: "1.5rem", 
            background: 'rgba(255,255,255,0.15)',
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: "600", color: "white", fontSize: "1.1rem" }}>Active Filters:</span>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: "0.5rem 1rem",
                  background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                  color: "white",
                  border: "none",
                  borderRadius: "15px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  boxShadow: '0 4px 15px rgba(238, 90, 82, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(238, 90, 82, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(238, 90, 82, 0.3)';
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {searchQuery && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>Text: "{searchQuery}"</span>}
              {filterSymbol && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>Symbol: {filterSymbol}</span>}
              {dateFrom && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>From: {dateFrom}</span>}
              {dateTo && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>To: {dateTo}</span>}
              {isLucidFilter !== "" && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>{isLucidFilter === "true" ? "Lucid Only" : "Non-Lucid Only"}</span>}
              {moodMin && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>Mood ≥ {moodMin}</span>}
              {moodMax && <span style={{ padding: "0.5rem 0.75rem", background: 'rgba(255,255,255,0.2)', borderRadius: "15px", fontSize: "0.9rem", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>Mood ≤ {moodMax}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Controls Row */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem",
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '15px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Sort Control */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div>
            <label style={{ marginRight: "0.75rem", fontWeight: "600", color: "white" }}>Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            >
              <option value="date" style={{color: '#333'}}>Date (Newest)</option>
              <option value="title" style={{color: '#333'}}>Title (A-Z)</option>
              <option value="mood" style={{color: '#333'}}>Mood Score</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link
            to="/create-dream"
            style={{
              padding: "0.75rem 1.5rem",
              background: 'linear-gradient(145deg, #28a745, #20c997)',
              color: "white",
              textDecoration: "none",
              borderRadius: "20px",
              fontSize: "1rem",
              fontWeight: "600",
              boxShadow: '0 5px 15px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 5px 15px rgba(40, 167, 69, 0.3)';
            }}
          >
             New Dream
          </Link>
          <button
            onClick={() => navigate(`/users/${user.id}`)}
            style={{
              padding: "0.75rem 1.5rem",
              background: 'linear-gradient(145deg, #6f42c1, #9d4edd)',
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              boxShadow: '0 5px 15px rgba(111, 66, 193, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(111, 66, 193, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 5px 15px rgba(111, 66, 193, 0.3)';
            }}
          >
             My Profile
          </button>
        </div>
      </div>

      {/* Results */}
      {dreams.length === 0 ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: "center",
          color: 'white'
        }}>
          {(searchQuery || filterSymbol || dateFrom || dateTo || isLucidFilter !== "" || moodMin || moodMax) ? (
            <>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔍</div>
              <h3 style={{fontSize: '1.8rem', marginBottom: '1rem', fontWeight: '300'}}>No dreams match your search</h3>
              <p style={{ opacity: '0.9', marginBottom: "2rem", fontSize: '1.1rem' }}>
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: "1rem 2rem",
                  background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: '1.1rem',
                  boxShadow: '0 8px 25px rgba(238, 90, 82, 0.3)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(238, 90, 82, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(238, 90, 82, 0.3)';
                }}
              >
                🔄 Clear All Filters
              </button>
            </>
          ) : (
            <>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💭</div>
              <h3 style={{fontSize: '1.8rem', marginBottom: '1rem', fontWeight: '300'}}>No dreams recorded yet</h3>
              <p style={{ opacity: '0.9', marginBottom: "2rem", fontSize: '1.1rem' }}>
                Start your dream journaling journey!
              </p>
              <Link 
                to="/create-dream"
                style={{
                  padding: "1rem 2rem",
                  background: 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "25px",
                  display: "inline-block",
                  fontWeight: "600",
                  fontSize: '1.1rem',
                  boxShadow: '0 8px 25px rgba(238, 90, 82, 0.3)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(238, 90, 82, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(238, 90, 82, 0.3)';
                }}
              >
                ✨ Write Your First Dream
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Dreams Grid */}
          <div style={{ 
            display: "grid", 
            gap: "2rem",
            marginBottom: "2rem"
          }}>
            {dreams.map((dream) => (
              <div 
                key={dream.id} 
                style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                  position: "relative",
                  color: 'white'
                }}
              >
                {/* Dream Header */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: "0 0 1rem 0", 
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      fontSize: '1.5rem',
                      fontWeight: '600'
                    }}>
                      {dream.title || "Untitled Dream"}
                      {dream.is_lucid && <span style={{ color: "#ffd93d" }}>☁️</span>}
                      {searchQuery && dream.title?.toLowerCase().includes(searchQuery.toLowerCase()) && (
                        <span style={{ 
                          background: 'rgba(255, 243, 205, 0.2)', 
                          padding: "0.25rem 0.5rem", 
                          borderRadius: "8px", 
                          fontSize: "0.8rem",
                          border: "1px solid rgba(255, 234, 167, 0.3)",
                          color: '#ffd93d',
                          fontWeight: '500'
                        }}>
                          title match
                        </span>
                      )}
                    </h3>
                    
                    <div style={{ 
                      display: "flex", 
                      gap: "1.5rem", 
                      fontSize: "1rem", 
                      color: "rgba(255,255,255,0.8)",
                      marginBottom: "0.5rem",
                      flexWrap: 'wrap'
                    }}>
                      <span> {new Date(dream.dream_date).toLocaleDateString()}</span>
                      {dream.mood_score && (
                        <span> Mood: {dream.mood_score}/10</span>
                      )}
                      {dream.sleep_duration && (
                        <span> Slept: {dream.sleep_duration}h</span>
                      )}
                      {dream.sleep_quality && (
                        <span> Quality: {dream.sleep_quality}/10</span>
                      )}
                      {dream.bedtime && (
                        <span> Bedtime: {new Date(`1970-01-01T${dream.bedtime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(dream.id)}
                    disabled={deleteLoading === dream.id}
                    style={{
                      background: 'linear-gradient(145deg, #dc3545, #c82333)',
                      color: "white",
                      border: "none",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "20px",
                      cursor: deleteLoading === dream.id ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      fontWeight: '600',
                      opacity: deleteLoading === dream.id ? 0.6 : 1,
                      transition: "all 0.3s ease",
                      boxShadow: '0 5px 15px rgba(220, 53, 69, 0.3)',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (deleteLoading !== dream.id) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(220, 53, 69, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deleteLoading !== dream.id) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 5px 15px rgba(220, 53, 69, 0.3)';
                      }
                    }}
                  >
                    {deleteLoading === dream.id ? "Deleting..." : " Delete"}
                  </button>
                </div>

                {/* Dream Content */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  padding: "1.5rem",
                  borderRadius: "15px",
                  marginBottom: "1.5rem",
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <p style={{ 
                    lineHeight: "1.7", 
                    color: "white",
                    margin: "0",
                    fontSize: '1.1rem'
                  }}>
                    {highlightSearchText(dream.content, searchQuery)}
                  </p>
                </div>

                {/* Sleep Information */}
                {(() => {
                  return (dream.sleep_duration !== null && dream.sleep_duration !== undefined) || 
                         (dream.sleep_quality !== null && dream.sleep_quality !== undefined) || 
                         (dream.bedtime !== null && dream.bedtime !== undefined) || 
                         (dream.sleep_disruptions && Array.isArray(dream.sleep_disruptions) && dream.sleep_disruptions.length > 0);
                })() && (
                  <div style={{ 
                    background: 'rgba(78, 205, 196, 0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: "1.5rem",
                    borderRadius: "15px",
                    marginBottom: "1.5rem",
                    border: "1px solid rgba(78, 205, 196, 0.3)"
                  }}>
                    <div style={{ 
                      fontWeight: "600", 
                      color: "#4ecdc4", 
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: '1.1rem'
                    }}>
                      <span> Sleep Information</span>
                    </div>
                    
                    {/* Sleep Metrics Grid */}
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
                      gap: "1rem", 
                      marginBottom: "1rem"
                    }}>
                      {dream.sleep_duration && (
                        <div style={{ 
                          background: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          padding: "1rem", 
                          borderRadius: "10px",
                          textAlign: "center",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "white", marginBottom: '0.5rem' }}>
                            {dream.sleep_duration}h
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                            Duration
                          </div>
                        </div>
                      )}
                      
                      {dream.sleep_quality && (
                        <div style={{ 
                          background: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          padding: "1rem", 
                          borderRadius: "10px",
                          textAlign: "center",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "white", marginBottom: '0.5rem' }}>
                            {dream.sleep_quality}/10
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                            Quality
                          </div>
                        </div>
                      )}
                      
                      {dream.bedtime && (
                        <div style={{ 
                          background: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          padding: "1rem", 
                          borderRadius: "10px",
                          textAlign: "center",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "white", marginBottom: '0.5rem' }}>
                            {new Date(`1970-01-01T${dream.bedtime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                            Bedtime
                          </div>
                        </div>
                      )}
                      
                      {dream.mood_score && (
                        <div style={{ 
                          background: 'rgba(255,255,255,0.15)', 
                          backdropFilter: 'blur(10px)',
                          padding: "1rem", 
                          borderRadius: "10px",
                          textAlign: "center",
                          border: "1px solid rgba(255,255,255,0.2)"
                        }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: "600", color: "white", marginBottom: '0.5rem' }}>
                            {dream.mood_score}/10
                          </div>
                          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                            Mood
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Sleep Issues */}
                    {dream.sleep_disruptions && dream.sleep_disruptions.length > 0 && (
                      <div style={{ 
                        background: 'rgba(255, 193, 7, 0.2)', 
                        backdropFilter: 'blur(10px)',
                        padding: "1rem", 
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 193, 7, 0.3)"
                      }}>
                        <div style={{ 
                          fontWeight: "600", 
                          color: "#ffc107", 
                          marginBottom: "0.75rem",
                          fontSize: "1rem"
                        }}>
                          ⚠️ Sleep Issues:
                        </div>
                        <div style={{ 
                          display: "flex", 
                          flexWrap: "wrap", 
                          gap: "0.75rem" 
                        }}>
                          {dream.sleep_disruptions.map((issue, index) => (
                            <span
                              key={index}
                              style={{
                                background: 'rgba(255,255,255,0.15)',
                                color: "white",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "15px",
                                fontSize: "0.9rem",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontWeight: '500'
                              }}
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Symbols */}
                {dream.symbols && dream.symbols.length > 0 && dream.symbols[0] !== null && (
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: "0.75rem",
                    marginTop: "1.5rem",
                    alignItems: 'center'
                  }}>
                    <span style={{ 
                      fontSize: "1rem", 
                      fontWeight: "600", 
                      color: "white",
                      marginRight: "0.5rem"
                    }}>
                      Symbols:
                    </span>
                    {dream.symbols.filter(s => s !== null).map((symbol, index) => (
                      <span
                        key={index}
                        onClick={() => setFilterSymbol(symbol === filterSymbol ? "" : symbol)}
                        style={{
                          background: filterSymbol === symbol 
                            ? 'linear-gradient(145deg, #ff6b6b, #ee5a52)' 
                            : 'rgba(255,255,255,0.15)',
                          color: "white",
                          padding: "0.5rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          border: filterSymbol === symbol 
                            ? "1px solid rgba(238, 90, 82, 0.5)"
                            : "1px solid rgba(255,255,255,0.3)",
                          fontWeight: '500',
                          boxShadow: filterSymbol === symbol 
                            ? '0 4px 15px rgba(238, 90, 82, 0.3)'
                            : '0 2px 10px rgba(0,0,0,0.1)',
                          transform: 'translateY(0)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          if (filterSymbol === symbol) {
                            e.target.style.boxShadow = '0 6px 20px rgba(238, 90, 82, 0.4)';
                          } else {
                            e.target.style.background = 'rgba(255,255,255,0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          if (filterSymbol === symbol) {
                            e.target.style.boxShadow = '0 4px 15px rgba(238, 90, 82, 0.3)';
                          } else {
                            e.target.style.background = 'rgba(255,255,255,0.15)';
                          }
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

          {/* Statistics Summary */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '2rem',
            marginBottom: "2rem",
            color: 'white'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}> Search Results Summary</h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              gap: "1.5rem",
              textAlign: "center"
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '15px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: "2rem", fontWeight: "600", color: "#4ecdc4", marginBottom: '0.5rem' }}>
                  {totalResults}
                </div>
                <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>
                  {(searchQuery || filterSymbol || dateFrom || dateTo || isLucidFilter !== "" || moodMin || moodMax) 
                    ? 'Matching Dreams' : 'Total Dreams'}
                </div>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '15px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: "2rem", fontWeight: "600", color: "#ffd93d", marginBottom: '0.5rem' }}>
                  {dreams.filter(d => d.is_lucid).length}
                </div>
                <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>Lucid Dreams</div>
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                borderRadius: '15px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: "2rem", fontWeight: "600", color: "#ff6b9d", marginBottom: '0.5rem' }}>
                  {[...new Set(dreams.flatMap(d => d.symbols?.filter(s => s !== null) || []))].length}
                </div>
                <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>Unique Symbols</div>
              </div>
              
              {dreams.some(d => d.mood_score) && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  padding: '1.5rem',
                  borderRadius: '15px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: "600", color: "#9d4edd", marginBottom: '0.5rem' }}>
                    {(dreams
                      .filter(d => d.mood_score)
                      .reduce((sum, d) => sum + d.mood_score, 0) / 
                      dreams.filter(d => d.mood_score).length
                    ).toFixed(1)}
                  </div>
                  <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.8)" }}>Avg Mood</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ 
            textAlign: "center", 
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            <Link
              to="/create-dream"
              style={{
                padding: "1rem 2rem",
                background: 'linear-gradient(145deg, #28a745, #20c997)',
                color: "white",
                textDecoration: "none",
                borderRadius: "25px",
                fontWeight: "600",
                fontSize: '1.1rem',
                boxShadow: '0 8px 25px rgba(40, 167, 69, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(40, 167, 69, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.3)';
              }}
            >
               Create New Dream
            </Link>
            
            <button
              onClick={() => navigate("/feed")}
              style={{
                padding: "1rem 2rem",
                background: 'linear-gradient(145deg, #6c757d, #5a6268)',
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: '1.1rem',
                boxShadow: '0 8px 25px rgba(108, 117, 125, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(108, 117, 125, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(108, 117, 125, 0.3)';
              }}
            >
               Dream Feed
            </button>
            
            <button
              onClick={() => navigate(`/users/${user.id}`)}
              style={{
                padding: "1rem 2rem",
                background: 'linear-gradient(145deg, #6f42c1, #9d4edd)',
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: '1.1rem',
                boxShadow: '0 8px 25px rgba(111, 66, 193, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(111, 66, 193, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(111, 66, 193, 0.3)';
              }}
            >
               My Profile
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);
}

// Utility function to highlight search text
function highlightSearchText(text, searchQuery) {
  if (!searchQuery || !text) return text;
  
  try {
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: "#fff3cd", padding: "0.1rem 0.2rem", borderRadius: "2px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch (e) {
    return text;
  }
}

export default MyDreams;

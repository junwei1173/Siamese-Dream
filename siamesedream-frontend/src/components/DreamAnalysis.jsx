import { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

function DreamAnalysis() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('all'); 
  
  const { user } = useContext(AuthContext);

  const calculateCorrelations = useCallback((dreams) => {
  const dreamsWithBothSleepAndMood = dreams.filter(d => d.sleep_duration && d.mood_score);
  const dreamsWithQualityAndMood = dreams.filter(d => d.sleep_quality && d.mood_score);
  
  return {
    sleepDurationVsMood: calculatePearsonCorrelation(
      dreamsWithBothSleepAndMood.map(d => d.sleep_duration),
      dreamsWithBothSleepAndMood.map(d => d.mood_score)
    ),
    sleepQualityVsMood: calculatePearsonCorrelation(
      dreamsWithQualityAndMood.map(d => d.sleep_quality),
      dreamsWithQualityAndMood.map(d => d.mood_score)
    )
  };
}, []);

  const processAnalysisData = useCallback((dreams) => {
    if (!dreams.length) {
      return {
        totalDreams: 0,
        dateRange: { start: null, end: null },
        moodAnalysis: {},
        sleepAnalysis: {},
        lucidAnalysis: {},
        symbolAnalysis: {},
        correlations: {},
        trends: {},
        recommendations: []
      };
    }

    // Basic stats
    const totalDreams = dreams.length;
    const lucidDreams = dreams.filter(d => d.is_lucid);
    const dreamsWithMood = dreams.filter(d => d.mood_score);
    const dreamsWithSleep = dreams.filter(d => d.sleep_duration || d.sleep_quality);

    // Date range
    const dates = dreams.map(d => new Date(d.dream_date)).sort((a, b) => a - b);
    const dateRange = {
      start: dates[0],
      end: dates[dates.length - 1]
    };

    // Mood Analysis
    const moodScores = dreamsWithMood.map(d => d.mood_score);
    const moodAnalysis = {
      average: moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length || 0,
      distribution: {
        nightmare: moodScores.filter(s => s <= 3).length,
        negative: moodScores.filter(s => s > 3 && s <= 5).length,
        neutral: moodScores.filter(s => s > 5 && s <= 7).length,
        positive: moodScores.filter(s => s > 7 && s <= 9).length,
        blissful: moodScores.filter(s => s >= 10).length
      },
      trend: calculateTrend(dreamsWithMood.map(d => ({ date: d.dream_date, value: d.mood_score })))
    };

    // Sleep Analysis
    const sleepDurations = dreamsWithSleep.filter(d => d.sleep_duration).map(d => d.sleep_duration);
    const sleepQualities = dreamsWithSleep.filter(d => d.sleep_quality).map(d => d.sleep_quality);
    const sleepAnalysis = {
      avgDuration: sleepDurations.reduce((sum, dur) => sum + dur, 0) / sleepDurations.length || 0,
      avgQuality: sleepQualities.reduce((sum, qual) => sum + qual, 0) / sleepQualities.length || 0,
      optimalRange: sleepDurations.filter(d => d >= 7 && d <= 9).length,
      disruptions: dreams.flatMap(d => d.sleep_disruptions || []).reduce((acc, disruption) => {
        acc[disruption] = (acc[disruption] || 0) + 1;
        return acc;
      }, {})
    };

    // Lucid Analysis
    const lucidAnalysis = {
      percentage: (lucidDreams.length / totalDreams) * 100,
      trend: calculateTrend(dreams.map(d => ({ date: d.dream_date, value: d.is_lucid ? 1 : 0 }))),
      avgMoodWhenLucid: lucidDreams.filter(d => d.mood_score).reduce((sum, d) => sum + d.mood_score, 0) / lucidDreams.filter(d => d.mood_score).length || 0,
      avgMoodWhenNonLucid: dreams.filter(d => !d.is_lucid && d.mood_score).reduce((sum, d) => sum + d.mood_score, 0) / dreams.filter(d => !d.is_lucid && d.mood_score).length || 0
    };

    // Symbol Analysis
    const allSymbols = dreams.flatMap(d => d.symbols || []).filter(s => s !== null);
    const symbolCounts = allSymbols.reduce((acc, symbol) => {
      acc[symbol] = (acc[symbol] || 0) + 1;
      return acc;
    }, {});
    const symbolAnalysis = {
      totalUnique: Object.keys(symbolCounts).length,
      mostCommon: Object.entries(symbolCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([symbol, count]) => ({ symbol, count, percentage: (count / totalDreams) * 100 })),
      symbolMoodCorrelation: calculateSymbolMoodCorrelation(dreams, symbolCounts)
    };

    // Correlations
    const correlations = calculateCorrelations(dreams);

    // Trends (monthly breakdown)
    const trends = calculateMonthlyTrends(dreams);

    // Generate recommendations
    const recommendations = generateRecommendations({
      moodAnalysis,
      sleepAnalysis,
      lucidAnalysis,
      symbolAnalysis,
      correlations
    });

    return {
      totalDreams,
      dateRange,
      moodAnalysis,
      sleepAnalysis,
      lucidAnalysis,
      symbolAnalysis,
      correlations,
      trends,
      recommendations
    };
  }, [calculateCorrelations]);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          user_id: user.id,
          limit: 1000,
          offset: 0
        });

        if (timeRange !== 'all') {
          const now = new Date();
          let dateFrom;
          switch (timeRange) {
            case '30days':
              dateFrom = new Date(now.setDate(now.getDate() - 30));
              break;
            case '90days':
              dateFrom = new Date(now.setDate(now.getDate() - 90));
              break;
            case 'year':
              dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
              break;
            default:
              break; 
          }
          if (dateFrom) {
            params.set('date_from', dateFrom.toISOString().split('T')[0]);
          }
        }

        const response = await fetch(`${API_URL}/dreams/search?${params}`);
        if (!response.ok) throw new Error('Failed to fetch dreams for analysis');

        const data = await response.json();
        const analysis = processAnalysisData(data.dreams);
        setAnalysisData(analysis);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [user, timeRange, processAnalysisData]); 
  const calculateTrend = (dataPoints) => {
    if (dataPoints.length < 2) return 'stable';
    
    // Simple linear trend calculation
    const sortedPoints = dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstHalf = sortedPoints.slice(0, Math.floor(sortedPoints.length / 2));
    const secondHalf = sortedPoints.slice(Math.floor(sortedPoints.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  };

  const calculateSymbolMoodCorrelation = (dreams, symbolCounts) => {
    const correlations = {};
    
    Object.keys(symbolCounts).forEach(symbol => {
      const dreamsWithSymbol = dreams.filter(d => d.symbols?.includes(symbol) && d.mood_score);
      if (dreamsWithSymbol.length > 0) {
        const avgMood = dreamsWithSymbol.reduce((sum, d) => sum + d.mood_score, 0) / dreamsWithSymbol.length;
        correlations[symbol] = avgMood;
      }
    });
    
    return Object.entries(correlations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symbol, mood]) => ({ symbol, avgMood: mood }));
  };




  const calculatePearsonCorrelation = (x, y) => {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const calculateMonthlyTrends = (dreams) => {
    const monthlyData = {};
    
    dreams.forEach(dream => {
      const monthKey = new Date(dream.dream_date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          count: 0,
          lucidCount: 0,
          totalMood: 0,
          moodCount: 0,
          totalSleepDuration: 0,
          sleepDurationCount: 0
        };
      }
      
      const month = monthlyData[monthKey];
      month.count++;
      if (dream.is_lucid) month.lucidCount++;
      if (dream.mood_score) {
        month.totalMood += dream.mood_score;
        month.moodCount++;
      }
      if (dream.sleep_duration) {
        month.totalSleepDuration += dream.sleep_duration;
        month.sleepDurationCount++;
      }
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) 
      .map(([month, data]) => ({
        month,
        dreamCount: data.count,
        lucidPercentage: (data.lucidCount / data.count) * 100,
        avgMood: data.moodCount > 0 ? data.totalMood / data.moodCount : 0,
        avgSleepDuration: data.sleepDurationCount > 0 ? data.totalSleepDuration / data.sleepDurationCount : 0
      }));
  };

  const generateRecommendations = (analysis) => {
    const recommendations = [];
    
    // Mood recommendations
    if (analysis.moodAnalysis.average < 6) {
      recommendations.push({
        type: 'mood',
        icon: '',
        title: 'Improve Dream Mood',
        description: 'Your average dream mood is below neutral. Consider dream incubation techniques or keeping a gratitude journal before bed.',
        priority: 'high'
      });
    }
    
    // Sleep recommendations
    if (analysis.sleepAnalysis.avgDuration < 7) {
      recommendations.push({
        type: 'sleep',
        icon: '',
        title: 'Increase Sleep Duration',
        description: `You're averaging ${analysis.sleepAnalysis.avgDuration.toFixed(1)} hours of sleep. Aim for 7-9 hours for better dream recall and mood.`,
        priority: 'high'
      });
    }
    
    if (analysis.sleepAnalysis.avgQuality < 6) {
      recommendations.push({
        type: 'sleep',
        icon: '',
        title: 'Improve Sleep Quality',
        description: 'Your sleep quality could be improved. Consider a consistent bedtime routine and limiting screen time before bed.',
        priority: 'medium'
      });
    }
    
    // Lucid dreaming recommendations
    if (analysis.lucidAnalysis.percentage < 10) {
      recommendations.push({
        type: 'lucid',
        icon: '',
        title: 'Enhance Lucid Dreaming',
        description: 'Try reality checks throughout the day and keep a detailed dream journal to increase lucid dream frequency.',
        priority: 'low'
      });
    }
    
    // Positive correlations
    if (analysis.correlations.sleepQualityVsMood > 0.3) {
      recommendations.push({
        type: 'insight',
        icon: '',
        title: 'Sleep Quality Affects Your Dreams',
        description: 'Your data shows better sleep quality correlates with more positive dreams. Prioritize sleep hygiene.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <h2> Analyzing your dreams...</h2>
        <p>This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "800px", margin: "auto", padding: "1rem", color: 'red', textAlign: "center" }}>
        Error loading analysis: {error}
      </div>
    );
  }

  if (!analysisData || analysisData.totalDreams === 0) {
    return (
      <div style={{ maxWidth: "800px", margin: "auto", padding: "1rem", textAlign: "center" }}>
        <h2> Dream Analysis</h2>
        <div style={{ backgroundColor: "#f8f9fa", padding: "3rem", borderRadius: "8px", marginTop: "2rem" }}>
          <h3>No dreams to analyze yet</h3>
          <p style={{ color: "#666", marginBottom: "2rem" }}>
            Record at least a few dreams to see your personalized analysis and insights.
          </p>
          <Link 
            to="/create-dream"
            style={{
              padding: "0.75rem 2rem",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "25px",
              display: "inline-block",
              fontWeight: "bold"
            }}
          >
            ✨ Start Recording Dreams
          </Link>
        </div>
      </div>
    );
  }

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
        Dream Analysis
      </h1>
      <p style={{
        fontSize: '1.2rem',
        margin: 0,
        opacity: '0.9'
      }}>
        Insights from {analysisData.totalDreams} dreams
        {analysisData.dateRange.start && (
          <span> • {analysisData.dateRange.start.toLocaleDateString()} to {analysisData.dateRange.end.toLocaleDateString()}</span>
        )}
      </p>
      
      {/* Time Range Selector */}
      <div style={{ marginTop: "1.5rem" }}>
        <label style={{ marginRight: "0.5rem", fontWeight: "bold", color: 'white' }}>Time Range:</label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "25px",
            border: "none",
            backgroundColor: "rgba(255,255,255,0.2)",
            color: 'white',
            backdropFilter: 'blur(10px)',
            fontSize: '1rem'
          }}
        >
          <option value="all" style={{color: '#333'}}>All Time</option>
          <option value="30days" style={{color: '#333'}}>Last 30 Days</option>
          <option value="90days" style={{color: '#333'}}>Last 3 Months</option>
          <option value="year" style={{color: '#333'}}>Last Year</option>
        </select>
      </div>
    </div>

    {/* Main Content */}
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Recommendations */}
      {analysisData.recommendations.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}> Personalized Recommendations</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            {analysisData.recommendations.map((rec, index) => (
              <div 
                key={index}
                style={{ 
                  padding: "1.5rem", 
                  borderLeft: `4px solid ${rec.priority === 'high' ? '#ff6b6b' : rec.priority === 'medium' ? '#ffd93d' : '#4ecdc4'}`,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: "0 15px 15px 0",
                  backdropFilter: 'blur(5px)'
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>{rec.icon}</span>
                  <h4 style={{ margin: 0, color: "white", fontSize: '1.1rem' }}>{rec.title}</h4>
                  <span style={{ 
                    padding: "0.2rem 0.8rem", 
                    borderRadius: "15px", 
                    fontSize: "0.7rem", 
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: rec.priority === 'high' ? '#ff6b6b' : rec.priority === 'medium' ? '#ffd93d' : '#4ecdc4'
                  }}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", lineHeight: "1.4" }}>{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "2rem", 
        marginBottom: "2rem" 
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', color: '#ffd93d', marginBottom: '0.5rem' }}></div>
          <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {analysisData.moodAnalysis.average.toFixed(1)}/10
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Average Mood</div>
          <div style={{ fontSize: "0.8rem", color: `${analysisData.moodAnalysis.trend === 'improving' ? '#4ecdc4' : analysisData.moodAnalysis.trend === 'declining' ? '#ff6b6b' : 'rgba(255,255,255,0.7)'}` }}>
            {analysisData.moodAnalysis.trend === 'improving' ? ' Improving' : 
             analysisData.moodAnalysis.trend === 'declining' ? ' Declining' : ' Stable'}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', color: '#ff6b9d', marginBottom: '0.5rem' }}></div>
          <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {analysisData.lucidAnalysis.percentage.toFixed(1)}%
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Lucid Dreams</div>
          <div style={{ fontSize: "0.8rem", color: `${analysisData.lucidAnalysis.trend === 'improving' ? '#4ecdc4' : analysisData.lucidAnalysis.trend === 'declining' ? '#ff6b6b' : 'rgba(255,255,255,0.7)'}` }}>
            {analysisData.lucidAnalysis.trend === 'improving' ? ' Increasing' : 
             analysisData.lucidAnalysis.trend === 'declining' ? ' Decreasing' : ' Stable'}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', color: '#4ecdc4', marginBottom: '0.5rem' }}></div>
          <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {analysisData.sleepAnalysis.avgDuration.toFixed(1)}h
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Avg Sleep</div>
          <div style={{ fontSize: "0.8rem", color: analysisData.sleepAnalysis.avgDuration >= 7 && analysisData.sleepAnalysis.avgDuration <= 9 ? '#4ecdc4' : '#ffd93d' }}>
            {analysisData.sleepAnalysis.avgDuration >= 7 && analysisData.sleepAnalysis.avgDuration <= 9 ? ' Optimal' : ' Adjust'}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', color: '#ffd93d', marginBottom: '0.5rem' }}></div>
          <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {analysisData.symbolAnalysis.totalUnique}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Unique Symbols</div>
        </div>
      </div>

      {/* Detailed Analysis Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
        
        {/* Mood Analysis */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}> Mood Distribution</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {Object.entries(analysisData.moodAnalysis.distribution).map(([mood, count]) => {
              const percentage = (count / analysisData.totalDreams) * 100;
              const colors = {
                nightmare: '#ff6b6b',
                negative: '#fd7e14',
                neutral: '#ffd93d',
                positive: '#4ecdc4',
                blissful: '#52c41a'
              };
              return (
                <div key={mood} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ minWidth: "100px", textTransform: "capitalize", fontSize: "0.9rem", color: 'white' }}>
                    {mood === 'nightmare' ? '' : mood === 'negative' ? '' : mood === 'neutral' ? '' : mood === 'positive' ? '' : ''} {mood}
                  </span>
                  <div style={{ 
                    flex: 1, 
                    height: "12px", 
                    backgroundColor: "rgba(255,255,255,0.2)", 
                    borderRadius: "10px",
                    position: "relative"
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: "100%",
                      backgroundColor: colors[mood],
                      borderRadius: "10px",
                      transition: "width 0.3s ease"
                    }}></div>
                  </div>
                  <span style={{ minWidth: "70px", fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", textAlign: 'right' }}>
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sleep Analysis */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}> Sleep Insights</h3>
          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '0.5rem' }}>
                <span style={{ color: 'white' }}>Sleep Quality</span>
                <strong style={{ color: 'white' }}>{analysisData.sleepAnalysis.avgQuality.toFixed(1)}/10</strong>
              </div>
              <div style={{ 
                width: "100%", 
                height: "10px", 
                backgroundColor: "rgba(255,255,255,0.2)", 
                borderRadius: "10px"
              }}>
                <div style={{
                  width: `${(analysisData.sleepAnalysis.avgQuality / 10) * 100}%`,
                  height: "100%",
                  backgroundColor: analysisData.sleepAnalysis.avgQuality >= 7 ? '#4ecdc4' : analysisData.sleepAnalysis.avgQuality >= 5 ? '#ffd93d' : '#ff6b6b',
                  borderRadius: "10px"
                }}></div>
              </div>
            </div>
            
            {Object.keys(analysisData.sleepAnalysis.disruptions).length > 0 && (
              <div>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: 'white' }}>Most Common Sleep Issues:</h4>
                {Object.entries(analysisData.sleepAnalysis.disruptions)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([disruption, count]) => (
                    <div key={disruption} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.5rem", color: 'rgba(255,255,255,0.9)' }}>
                      <span> {disruption}</span>
                      <span>{count}x</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Correlations */}
      {(Math.abs(analysisData.correlations.sleepDurationVsMood) > 0.1 || Math.abs(analysisData.correlations.sleepQualityVsMood) > 0.1) && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '2rem',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}> Sleep-Mood Correlations</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            
            {Math.abs(analysisData.correlations.sleepDurationVsMood) > 0.1 && (
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ color: 'white', marginBottom: '1rem' }}>Sleep Duration ↔ Dream Mood</h4>
                <div style={{ display: "flex", alignItems: "center", justifyContent: 'center', gap: "1rem" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: Math.abs(analysisData.correlations.sleepDurationVsMood) > 0.3 ? 
                      (analysisData.correlations.sleepDurationVsMood > 0 ? '#4ecdc4' : '#ff6b6b') : '#ffd93d',
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '1.2rem'
                  }}>
                    {(analysisData.correlations.sleepDurationVsMood * 100).toFixed(0)}%
                  </div>
                </div>
                <p style={{ margin: "1rem 0 0 0", fontSize: "0.9rem", color: 'rgba(255,255,255,0.9)' }}>
                  {analysisData.correlations.sleepDurationVsMood > 0.3 ? 
                    "Strong positive correlation! More sleep = better dreams" :
                    analysisData.correlations.sleepDurationVsMood < -0.3 ?
                    "Strong negative correlation detected" :
                    "Weak correlation detected"
                  }
                </p>
              </div>
            )}

            {Math.abs(analysisData.correlations.sleepQualityVsMood) > 0.1 && (
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ color: 'white', marginBottom: '1rem' }}>Sleep Quality ↔ Dream Mood</h4>
                <div style={{ display: "flex", alignItems: "center", justifyContent: 'center', gap: "1rem" }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: Math.abs(analysisData.correlations.sleepQualityVsMood) > 0.3 ? 
                      (analysisData.correlations.sleepQualityVsMood > 0 ? '#4ecdc4' : '#ff6b6b') : '#ffd93d',
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: '1.2rem'
                  }}>
                    {(analysisData.correlations.sleepQualityVsMood * 100).toFixed(0)}%
                  </div>
                </div>
                <p style={{ margin: "1rem 0 0 0", fontSize: "0.9rem", color: 'rgba(255,255,255,0.9)' }}>
                  {analysisData.correlations.sleepQualityVsMood > 0.3 ? 
                    "Strong positive correlation! Better sleep quality = better dreams" :
                    analysisData.correlations.sleepQualityVsMood < -0.3 ?
                    "Strong negative correlation detected" :
                    "Weak correlation detected"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Symbol Analysis */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.2)',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}> Symbol Analysis</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          
          {/* Most Common Symbols */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Most Frequent Symbols</h4>
            {analysisData.symbolAnalysis.mostCommon.length > 0 ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {analysisData.symbolAnalysis.mostCommon.slice(0, 8).map((symbol, index) => (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem", color: 'white' }}>#{symbol.symbol}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ 
                        width: "80px", 
                        height: "8px", 
                        backgroundColor: "rgba(255,255,255,0.2)", 
                        borderRadius: "4px"
                      }}>
                        <div style={{
                          width: `${symbol.percentage}%`,
                          height: "100%",
                          backgroundColor: "#4ecdc4",
                          borderRadius: "4px"
                        }}></div>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", minWidth: "40px" }}>
                        {symbol.count}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", textAlign: 'center' }}>No symbols recorded yet.</p>
            )}
          </div>

          {/* Mood-Symbol Correlations */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Symbols with Best Dream Moods</h4>
            {analysisData.symbolAnalysis.symbolMoodCorrelation.length > 0 ? (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {analysisData.symbolAnalysis.symbolMoodCorrelation.map((correlation, index) => (
                  <div key={index} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    padding: "0.75rem",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "10px"
                  }}>
                    <span style={{ fontSize: "0.9rem", color: 'white' }}>#{correlation.symbol}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        padding: "0.3rem 0.8rem",
                        borderRadius: "15px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "white",
                        backgroundColor: correlation.avgMood >= 7 ? '#4ecdc4' : correlation.avgMood >= 5 ? '#ffd93d' : '#ff6b6b'
                      }}>
                        {correlation.avgMood.toFixed(1)}/10
                      </span>
                      <span style={{ fontSize: "1rem" }}>
                        {correlation.avgMood >= 8 ? '' : correlation.avgMood >= 6 ? '' : correlation.avgMood >= 4 ? '' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", textAlign: 'center' }}>Not enough data for mood correlations.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lucid Dream Analysis */}
      {analysisData.lucidAnalysis.percentage > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '2rem',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}> Lucid Dream Insights</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
            
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem", color: '#ff6b9d' }}>
                {analysisData.lucidAnalysis.percentage.toFixed(1)}%
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
                of your dreams are lucid
              </div>
            </div>

            {analysisData.lucidAnalysis.avgMoodWhenLucid > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem", color: "#4ecdc4" }}>
                  {analysisData.lucidAnalysis.avgMoodWhenLucid.toFixed(1)}/10
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
                  avg mood when lucid
                </div>
              </div>
            )}

            {analysisData.lucidAnalysis.avgMoodWhenNonLucid > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem", color: "rgba(255,255,255,0.6)" }}>
                  {analysisData.lucidAnalysis.avgMoodWhenNonLucid.toFixed(1)}/10
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
                  avg mood when non-lucid
                </div>
              </div>
            )}
          </div>

          {analysisData.lucidAnalysis.avgMoodWhenLucid > analysisData.lucidAnalysis.avgMoodWhenNonLucid && (
            <div style={{
              marginTop: "1.5rem",
              padding: "1.5rem",
              backgroundColor: "rgba(76, 217, 100, 0.2)",
              borderRadius: "15px",
              border: "1px solid rgba(76, 217, 100, 0.3)"
            }}>
              <p style={{ margin: 0, color: "white" }}>
                 <strong>Insight:</strong> Your lucid dreams have {(analysisData.lucidAnalysis.avgMoodWhenLucid - analysisData.lucidAnalysis.avgMoodWhenNonLucid).toFixed(1)} points higher mood on average! 
                Consider practicing more lucid dreaming techniques.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Trends */}
      {analysisData.trends.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '2rem',
          color: 'white'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}> Monthly Trends</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "1rem 0.5rem", borderBottom: "2px solid rgba(255,255,255,0.3)", textAlign: "left", color: 'white' }}>Month</th>
                  <th style={{ padding: "1rem 0.5rem", borderBottom: "2px solid rgba(255,255,255,0.3)", textAlign: "center", color: 'white' }}>Dreams</th>
                  <th style={{ padding: "1rem 0.5rem", borderBottom: "2px solid rgba(255,255,255,0.3)", textAlign: "center", color: 'white' }}>Lucid %</th>
                  <th style={{ padding: "1rem 0.5rem", borderBottom: "2px solid rgba(255,255,255,0.3)", textAlign: "center", color: 'white' }}>Avg Mood</th>
                  <th style={{ padding: "1rem 0.5rem", borderBottom: "2px solid rgba(255,255,255,0.3)", textAlign: "center", color: 'white' }}>Avg Sleep</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.trends.slice(-6).map((trend, index) => (
                  <tr key={index}>
                    <td style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.2)", color: 'white' }}>
                      {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.2)", textAlign: "center", color: 'white' }}>
                      {trend.dreamCount}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.2)", textAlign: "center", color: 'white' }}>
                      {trend.lucidPercentage.toFixed(1)}%
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.2)", textAlign: "center" }}>
                      {trend.avgMood > 0 ? (
                        <span style={{
                          padding: "0.3rem 0.8rem",
                          borderRadius: "15px",
                          fontSize: "0.8rem",
                          fontWeight: "bold",
                          color: "white",
                          backgroundColor: trend.avgMood >= 7 ? '#4ecdc4' : trend.avgMood >= 5 ? '#ffd93d' : '#ff6b6b'
                        }}>
                          {trend.avgMood.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", borderBottom: "1px solid rgba(255,255,255,0.2)", textAlign: "center", color: 'white' }}>
                      {trend.avgSleepDuration > 0 ? `${trend.avgSleepDuration.toFixed(1)}h` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export/Actions */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '2rem',
        border: '1px solid rgba(255,255,255,0.2)',
        textAlign: 'center',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}> Want More Insights?</h3>
        <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "1.5rem" }}>
          Keep recording your dreams to unlock deeper patterns and more personalized recommendations.
        </p>
        
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/create-dream"
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(145deg, #4ecdc4, #44a08d)",
              color: "white",
              textDecoration: "none",
              borderRadius: "25px",
              fontWeight: "bold",
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
             Record New Dream
          </Link>
          
          <Link
            to="/mydreams"
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(145deg, #ff6b6b, #ee5a52)",
              color: "white",
              textDecoration: "none",
              borderRadius: "25px",
              fontWeight: "bold",
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
             View All Dreams
          </Link>
          
          <Link
            to={`/users/${user?.id}`}
            style={{
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(145deg, #667eea, #764ba2)",
              color: "white",
              textDecoration: "none",
              borderRadius: "25px",
              fontWeight: "bold",
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-5px)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
             My Profile
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}

export default DreamAnalysis;

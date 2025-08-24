import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../AuthContext";

function CreateDream() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [symbols, setSymbols] = useState("");
  const [isLucid, setIsLucid] = useState(false);
  const [moodScore, setMoodScore] = useState(5);
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sleepDuration, setSleepDuration] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [bedtime, setBedtime] = useState("");
  const [sleepDisruptions, setSleepDisruptions] = useState([]);
  const [otherDisruption, setOtherDisruption] = useState("");
  const [otherChecked, setOtherChecked] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setIsSubmitting(true);

    if (!user) {
      setMsg("You must be logged in to submit a dream.");
      setIsSubmitting(false);
      return;
    }

    const symbolsArray = symbols
      .split(/[,\s#]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const dreamData = {
  user_id: user.id,
  content: text,
  summary: title,
  is_lucid: isLucid,
  mood_score: moodScore,
  dream_date: new Date().toISOString(),
  symbols: symbolsArray,
  sleep_duration: sleepDuration,
  sleep_quality: sleepQuality,
  bedtime: bedtime || null,
  sleep_disruptions: sleepDisruptions,
};

    console.log('Raw symbols input:', symbols);
    console.log('Processed symbolsArray:', symbolsArray);
    console.log('Sending dream data:', dreamData);

    try {
      await axios.post(`${API_URL}/dreams`, dreamData);

      setMsg("✅ Dream submitted successfully!");
      setTitle("");
      setText("");
      setSymbols("");
      setIsLucid(false);
      setMoodScore(5);
      setSleepDuration(7);
      setSleepQuality(5);
      setBedtime("");
      setSleepDisruptions([]);

      // Redirect after a short delay to show the success message
      setTimeout(() => {
        navigate("/mydreams");
      }, 1500);
    } catch (err) {
      setMsg(err.response?.data?.error || "❌ Failed to submit dream.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      }}>✨</div>
      <h1 style={{
        fontSize: '2.5rem',
        margin: '0 0 0.5rem 0',
        fontWeight: '300',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        Create New Dream
      </h1>
      <p style={{
        fontSize: '1.2rem',
        margin: 0,
        opacity: '0.9'
      }}>
        Share your dream journey with the community
      </p>
    </div>

    {/* Main Container */}
    <div style={{
      maxWidth: "800px", 
      margin: "0 auto"
    }}>
      {/* Form Container */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              fontWeight: "600", 
              marginBottom: "0.75rem",
              color: "white",
              fontSize: "1.1rem"
            }}>
              Dream Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Give your dream a memorable title..."
              style={{ 
                width: "100%", 
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "12px",
                fontSize: "1rem",
                boxSizing: "border-box",
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            />
          </div>

          {/* Dream Content */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ 
              display: "block", 
              fontWeight: "600", 
              marginBottom: "0.75rem",
              color: "white",
              fontSize: "1.1rem"
            }}>
              Dream Description
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={8}
              placeholder="Describe your dream in detail..."
              style={{ 
                width: "100%", 
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "12px",
                fontSize: "1rem",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: "1.6",
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            />
          </div>

          {/* Two Column Layout for Additional Fields */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            {/* Lucid Dream Toggle */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1.5rem',
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                fontWeight: "600",
                color: "white",
                cursor: "pointer",
                fontSize: "1.1rem"
              }}>
                <input
                  type="checkbox"
                  checked={isLucid}
                  onChange={(e) => setIsLucid(e.target.checked)}
                  style={{ 
                    marginRight: "0.75rem",
                    transform: "scale(1.2)"
                  }}
                />
                 Lucid Dream
              </label>
            </div>

            {/* Mood Score */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '1.5rem',
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <label style={{ 
                display: "block", 
                fontWeight: "600", 
                marginBottom: "0.75rem",
                color: "white",
                fontSize: "1.1rem"
              }}>
                Mood Score: {moodScore}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={moodScore}
                onChange={(e) => setMoodScore(parseInt(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontSize: "0.9rem", 
                color: "rgba(255,255,255,0.8)",
                marginTop: "0.5rem"
              }}>
                <span> Nightmare</span>
                <span> Blissful</span>
              </div>
            </div>
          </div>

          {/* Sleep Tracking Section */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: "2rem", 
            borderRadius: "15px",
            marginBottom: "1.5rem",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <h3 style={{ margin: "0 0 1.5rem 0", color: "white", fontSize: "1.3rem" }}>Sleep Information</h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "1.5rem",
              marginBottom: "1.5rem"
            }}>
              {/* Sleep Duration */}
              <div>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "0.75rem",
                  color: "white",
                  fontSize: "1rem"
                }}>
                  Hours Slept: {sleepDuration}h
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(parseFloat(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "0.9rem", 
                  color: "rgba(255,255,255,0.8)",
                  marginTop: "0.5rem"
                }}>
                  <span>3h</span>
                  <span>12h</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "0.75rem",
                  color: "white",
                  fontSize: "1rem"
                }}>
                  Sleep Quality: {sleepQuality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "0.9rem", 
                  color: "rgba(255,255,255,0.8)",
                  marginTop: "0.5rem"
                }}>
                  <span> Terrible</span>
                  <span> Perfect</span>
                </div>
              </div>
            </div>

            {/* Bedtime */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                fontWeight: "600", 
                marginBottom: "0.75rem",
                color: "white",
                fontSize: "1rem"
              }}>
                Bedtime (optional)
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                style={{ 
                  padding: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }}
              />
            </div>

            {/* Sleep Disruptions */}
<div>
  <label style={{ 
    display: "block", 
    fontWeight: "600", 
    marginBottom: "0.75rem",
    color: "white",
    fontSize: "1rem"
  }}>
    Sleep Issues (optional)
  </label>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
    {["Trouble falling asleep", "Woke up during night", "Nightmares", "Restless sleep"].map((disruption) => (
      <label key={disruption} style={{ 
        display: "flex", 
        alignItems: "center", 
        fontSize: "0.95rem",
        cursor: "pointer",
        color: "white",
        background: 'rgba(255,255,255,0.1)',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <input
          type="checkbox"
          checked={sleepDisruptions.includes(disruption)}
          onChange={(e) => {
            if (e.target.checked) {
              setSleepDisruptions([...sleepDisruptions, disruption]);
            } else {
              setSleepDisruptions(sleepDisruptions.filter(d => d !== disruption));
            }
          }}
          style={{ marginRight: "0.5rem" }}
        />
        {disruption}
      </label>
    ))}

    {/* Other option */}
<label style={{ 
  display: "flex", 
  alignItems: "center", 
  fontSize: "0.95rem",
  cursor: "pointer",
  color: "white",
  background: 'rgba(255,255,255,0.1)',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.2)'
}}>
  <input
    type="checkbox"
    checked={otherChecked}
    onChange={(e) => {
      setOtherChecked(e.target.checked);
      if (!e.target.checked) {
        // remove old value
        setSleepDisruptions(sleepDisruptions.filter(d => d !== otherDisruption));
        setOtherDisruption("");
      }
    }}
    style={{ marginRight: "0.5rem" }}
  />
  Other
</label>

{otherChecked && (
  <input
    type="text"
    value={otherDisruption}
    onChange={(e) => setOtherDisruption(e.target.value)}
    onBlur={() => {
      if (otherDisruption.trim()) {
        // replace any old "other" entry with the latest
        setSleepDisruptions([
          ...sleepDisruptions.filter(d => d !== otherDisruption),
          otherDisruption.trim()
        ]);
      }
    }}
    placeholder="Enter your issue..."
    style={{
      padding: "0.5rem",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.3)",
      background: "rgba(255,255,255,0.15)",
      color: "white",
      flex: "1"
    }}
  />
)}

  </div>
</div>

          </div>

          {/* Symbols Field */}
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ 
              display: "block", 
              fontWeight: "600", 
              marginBottom: "0.75rem",
              color: "white",
              fontSize: "1.1rem"
            }}>
              Dream Symbols
            </label>
            <input
              type="text"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              placeholder="flying, water, animals, darkness, family..."
              style={{ 
                width: "100%", 
                padding: "1rem",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "12px",
                fontSize: "1rem",
                boxSizing: "border-box",
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            />
            <p style={{ 
              fontSize: "0.9rem", 
              color: "rgba(255,255,255,0.8)", 
              margin: "0.75rem 0 0 0" 
            }}>
              Separate with commas, spaces, or # symbols
            </p>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: "center" }}>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "1rem 3rem",
                background: isSubmitting 
                  ? 'linear-gradient(145deg, #6c757d, #5a6268)'
                  : 'linear-gradient(145deg, #ff6b6b, #ee5a52)',
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "1.1rem",
                fontWeight: "600",
                opacity: isSubmitting ? 0.7 : 1,
                transition: "all 0.3s ease",
                boxShadow: isSubmitting 
                  ? '0 5px 15px rgba(0,0,0,0.2)'
                  : '0 8px 25px rgba(238, 90, 82, 0.3)',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(238, 90, 82, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 25px rgba(238, 90, 82, 0.3)';
                }
              }}
            >
              {isSubmitting ? "✨ Submitting..." : " Submit Dream"}
            </button>
          </div>
        </form>

        {/* Status Message */}
        {msg && (
          <div style={{ 
            marginTop: "2rem",
            padding: "1.5rem",
            borderRadius: "15px",
            textAlign: "center",
            background: msg.includes("✅") 
              ? 'rgba(40, 167, 69, 0.2)'
              : 'rgba(220, 53, 69, 0.2)',
            color: msg.includes("✅") ? "#28a745" : "#dc3545",
            border: `1px solid ${msg.includes("✅") 
              ? 'rgba(40, 167, 69, 0.3)' 
              : 'rgba(220, 53, 69, 0.3)'}`,
            backdropFilter: 'blur(10px)',
            fontSize: "1.1rem",
            fontWeight: "500"
          }}>
            {msg}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div style={{ 
        textAlign: "center", 
        display: "flex",
        gap: "1rem",
        justifyContent: "center"
      }}>
        <button
          onClick={() => navigate("/mydreams")}
          style={{
            padding: "0.75rem 1.5rem",
            background: 'linear-gradient(145deg, #6c757d, #5a6268)',
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "500",
            boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
          }}
        >
           My Dreams
        </button>
        <button
          onClick={() => navigate("/feed")}
          style={{
            padding: "0.75rem 1.5rem",
            background: 'linear-gradient(145deg, #4ecdc4, #44a08d)',
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "500",
            boxShadow: '0 5px 15px rgba(68, 160, 141, 0.3)',
            transition: 'all 0.3s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 20px rgba(68, 160, 141, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 5px 15px rgba(68, 160, 141, 0.3)';
          }}
        >
           Dream Feed
        </button>
      </div>
    </div>
  </div>
);
}

export default CreateDream;

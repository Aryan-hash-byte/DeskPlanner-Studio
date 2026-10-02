import React, { useState, useEffect } from 'react';
import TodoItem from './TodoItem';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('activeUser') || '');
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('activeUsername') || '');
  const [activeModal, setActiveModal] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); 
  const [selectedTime, setSelectedTime] = useState('');
  const [timePeriod, setTimePeriod] = useState('AM');
  const [priority, setPriority] = useState('low'); 
  const [filterDate, setFilterDate] = useState('');

  // Automatically fetches and loads tasks from your Django backend on startup
  useEffect(() => {
    const fetchTasksFromBackend = async () => {
      if (!currentUser) {
        setTasks([]);
        setCurrentUsername('');
        return;
      }

      // Sync your display username from local storage
      const savedName = localStorage.getItem('activeUsername') || currentUser;
      setCurrentUsername(savedName);

      try {
        // Send a GET request across the bridge to load your tasks
        const response = await fetch('http://localhost:8000/api/tasks/', {
          method: 'GET',
       headers: {
  'Content-Type': 'application/json',
  'X-User-Profile':
    localStorage.getItem('activeUsername') || currentUsername
}
        });

        const data = await response.json();

        if (response.ok) {
          // Success: Populate your visual planner notebook with real database records
          setTasks(data);
        } else {
          console.error("Backend refused to yield tasks:", data.error);
        }
      } catch (error) {
        console.error("Network error fetching tasks from ledger:", error);
      }
    };

    fetchTasksFromBackend();
  }, [currentUser]);


  const saveToStorage = (updatedTasks) => {
    setTasks(updatedTasks);
    if (currentUser) localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(updatedTasks));
  };

  //
 const addTask = async (e) => {
  if (e) e.preventDefault();

  if (!input.trim()) return;

  try {
    const response = await fetch('http://localhost:8000/api/tasks/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Profile':
          localStorage.getItem('activeUsername') || currentUser
      },
      body: JSON.stringify({
        text: input,
        date: selectedDate || new Date().toISOString().split('T')[0],
        time: selectedTime || "12:00",
        priority: priority || "low"
      })
    });

    const newTaskFromServer = await response.json();

    if (response.ok) {
      setTasks(prevTasks => [...prevTasks, newTaskFromServer]);

      setInput('');
      setSelectedDate('');
      setSelectedTime('');
      setPriority('low');

    } else {
      alert(
        "Server refused to log task: " +
        (newTaskFromServer.error || "Unknown error")
      );
    }

  } catch (error) {
    console.error("Task submission network error:", error);
    alert("Network Error: Could not save item to the server ledger.");
  }
};
    
  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Profile':
  localStorage.getItem('activeUsername') || currentUsername
        },
        body: JSON.stringify({
          completed: !currentStatus // Flips True to False or vice versa
        }),
      });

      const updatedTask = await response.json();

      if (response.ok){
        // 🌟 UPDATED: Uses the prevTasks pattern for instant checkbox syncing
        setTasks(prevTasks => prevTasks.map(tk => tk.id === taskId ? updatedTask : tk));
      }

else {
        alert("Could not update task status: " + (updatedTask.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Checkbox network status error:", error);
      alert("Network Error: Could not sync completion status to the server database.");
    }
  };

      const deleteTaskFromServer = async (taskId) => {
    try {
      // 🛑 ENSURE THIS EXACT URL HAS BOTH THE ID AND A TRAILING SLASH AT THE END:
      const response = await fetch(`http://localhost:8000/api/tasks/${taskId}/`, {
        method: 'DELETE', // 👈 Must use uppercase DELETE
        headers: {
          'Content-Type': 'application/json',
          'X-User-Profile': localStorage.getItem('activeUsername') || currentUser
        }
      });

      const data = await response.json();
      if (response.ok) {
        // 🌟 UPDATED: Uses the prevTasks pattern for instant row removal visuals
        setTasks(prevTasks => prevTasks.filter(tk => tk.id !== taskId));
      }
 else {
        alert("Server refused deletion: " + (data.error || "Unknown mismatch"));
      }
    } catch (error) {
      console.error("Task deletion network status error:", error);
    }
  };




  // 2. Authentication Bridge connected to Django Database
  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault(); 
    
    const formattedEmail = emailInput.trim().toLowerCase();
    const formattedUsername = usernameInput.trim();

    if (!formattedEmail || !passwordInput) {
      alert("Please fill in all required text fields!");
      return;
    }

    if (activeModal === 'signup') {
      if (!formattedUsername) {
        alert("Please provide a username for registration!");
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/register/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formattedUsername,
            email: formattedEmail,
            password: passwordInput
          }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('activeUser', formattedEmail);
          localStorage.setItem('activeUsername', formattedUsername);
          localStorage.setItem(`name_${formattedEmail}`, formattedUsername);
          
          setCurrentUser(formattedEmail);
          setCurrentUsername(formattedUsername);
          
          alert("Account created successfully! Check your email inbox.");
          setActiveModal(null);
        } else {
          alert("Registration failed: " + (data.error || data.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Network error connecting to Django:", error);
        alert("Network error: Could not reach backend. Is your Django server running?");
      }

    }    else {
      // --- Connected Login Workflow ---
      try {
        const response = await fetch('http://localhost:8000/api/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // 🛑 FORCE IT TO SEND EXACTLY WHAT YOU TYPED IN THE BOX:
            username: emailInput.trim(), 
            password: passwordInput
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const targetName = data.username || emailInput.trim();
          localStorage.setItem('activeUser', emailInput.trim());
          localStorage.setItem('activeUsername', targetName);
          localStorage.setItem(`name_${emailInput.trim()}`, targetName);
          
          setCurrentUser(emailInput.trim());
          setCurrentUsername(targetName);
          setActiveModal(null);
          alert("Welcome back! Loading your planner ledger sheets...");
        } else {
          alert("Login Denied: " + (data.error || "Incorrect credentials match. Access Denied."));
        }
      } catch (error) {
        console.error("Login connection network error:", error);
        alert("Network Error: Could not reach backend validation gate.");
      }
    }



    setEmailInput('');
    setPasswordInput('');
    setUsernameInput('');
  };

  const handleLogout = () => {
    localStorage.removeItem('activeUser');
    localStorage.removeItem('activeUsername');
    setCurrentUser('');
    setCurrentUsername('');
  };

  const formatTaskDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Anytime';
    // 🌟 PASTE THIS IN PLACE OF YOUR OLD SINGLE LINE:
  // 🌟 THE VAULT FIX: Extracts index [0] to compare flat text strings perfectly!
  // 🔬 TEMPORARY DIAGNOSTIC FILTER (Forces React to show ALL tasks instantly):
  const displayedTasks = false // 👈 Change "filterDate" to "false" right here temporarily!
    ? tasks.filter(t => {
        if (!t.date) return false;
        const taskDateClean = String(t.date).split('T')[0];
        const filterDateClean = String(filterDate).split('T')[0];
        return taskDateClean === filterDateClean;
      }) 
    : tasks; // 👈 This forces it to pass the full database array directly to the screen!


  // 3. Presentation / User Interface Layer
  return (
    <div className="app-wrapper">
      <header className="top-bar">
        <div className="logo">📝 DeskPlanner Studio</div>
        <div className="auth-buttons">
          {currentUser ? (
            <div className="user-profile-zone">
              <span className="user-tag">👋 Welcome, <strong>{currentUsername}</strong></span>
              <button className="btn-secondary logout-btn" onClick={handleLogout}>Log Out</button>
            </div>
          ) : (
            <div className="auth-actions">
              <button className="btn-secondary" onClick={() => setActiveModal('login')}>Log In</button>
              <button className="btn-primary" onClick={() => setActiveModal('signup')}>Create Account</button>
            </div>
          )}
        </div>
      </header>
      
      <div className="desk-surface">
        <main className="notebook-container">
          {/* Unbroken Spiral Rings Mapping */}
          <div className="spiral-binding">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="spiral-ring"></div>
            ))}
          </div>
          
          <div className="notebook-page">
            <h2>Daily Schedule Planner</h2>
            
            <div className="calendar-filter-row">
              <label htmlFor="filter-calendar">🔎 Filter Lookup:</label>
              <input 
                id="filter-calendar" 
                type="date" 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
                className="filter-date-input" 
              />
              {filterDate && (
                <button className="clear-filter" onClick={() => setFilterDate('')}>Show All</button>
              )}
            </div>
            
            <div className="input-section">
              <input 
                type="text" 
                placeholder="Write down a task..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                className="task-input-field" 
              />
              
              <div className="datetime-picker-group">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="notebook-date-picker" 
                />
                <div className="ampm-time-wrapper">
                  <input 
                    type="text" 
                    placeholder="12:00" 
                    maxLength="5" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)} 
                    className="notebook-time-picker" 
                  />
                  <select 
                    value={timePeriod} 
                    onChange={(e) => setTimePeriod(e.target.value)} 
                    className="ampm-dropdown"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              
              <div className="priority-options">
                {['low', 'medium', 'high'].map(p => (
                  <button 
                    key={p} 
                    type="button" 
                    className={`prio-dot option-${p} ${priority === p ? 'active' : ''}`} 
                    onClick={() => setPriority(p)}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <button className="add-task-btn" onClick={addTask}>🖊️ Save to Ledger</button>
            </div>
            
            <ul className="task-list">
              {displayedTasks.length === 0 ? (
                <p className="empty-state">
                  {!currentUser ? "⚠️ Log in above to access your planner sheets." : "No entries logged for this selection."}
                </p>
              ) : (
                displayedTasks.map((t) => (
                                      <TodoItem 
                    key={t.id} 
                    task={t} 
                    // 🛑 UPDATE THIS EXACT PROPERTY LINE:
                    onToggle={() => toggleTaskCompletion(t.id, t.completed)} 
                    onDelete={() => deleteTaskFromServer(t.id)} 
                    formatDate={formatTaskDate} 
                  />

                ))
              )}
            </ul>
          </div>
        </main>
      </div>

      {/* 4. Complete Secure Form Modal Layout */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAuthSubmit}>
            <h3>{activeModal === 'login' ? 'Authorise User' : 'Register Account'}</h3>
            <p className="modal-subtitle">Handwrite details to manage your private logs.</p>
            
            {activeModal === 'signup' && (
              <input 
                type="text" 
                placeholder="Your Name" 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                required 
              />
            )}
            
            <input 
              type="text" 
              placeholder="Email or Username" 
              value={emailInput} 
              onChange={e => setEmailInput(e.target.value)} 
              required 
            />
            
            <input 
              type="password" 
              placeholder="Password" 
              value={passwordInput} 
              onChange={e => setPasswordInput(e.target.value)} 
              required 
            />
            
            <button type="submit" className="btn-primary">Confirm</button>
            <button type="button" className="close-modal" onClick={() => setActiveModal(null)}>✕</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;


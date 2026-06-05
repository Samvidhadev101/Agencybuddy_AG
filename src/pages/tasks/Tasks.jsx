import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Clock, Calendar, CheckSquare, 
  Trash2, X, Play, Square, Tag, ArrowRight, ShieldAlert 
} from 'lucide-react';

export default function Tasks() {
  const { selectedClientId, clients, agency } = useApp();
  const [tasks, setTasks] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Quick task inputs
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCol, setQuickCol] = useState(null);

  // Add Task Modal Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newModule, setNewModule] = useState('general');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatus, setNewStatus] = useState('todo');
  const [formError, setFormError] = useState('');

  // Time Tracker state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timePassed, setTimePassed] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [selectedClientId]);

  // Fetch teammates list for assignee selector
  useEffect(() => {
    supabase.from('users').then(({ data }) => {
      setTeammates(data || []);
    });
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
    };
  }, [timerIntervalId]);

  const loadTasks = async () => {
    let query = supabase.from('tasks');
    if (selectedClientId) {
      query = query.eq('client_id', selectedClientId);
    }
    const { data } = await query;
    setTasks(data || []);
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewDesc('');
    setNewClient(selectedClientId || (clients[0]?.id || ''));
    setNewAssignee(teammates[0]?.id || '');
    setNewModule('general');
    setNewPriority('medium');
    setNewDueDate(new Date().toISOString().split('T')[0]);
    setNewStatus('todo');
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (!newClient) {
      setFormError('Please select a client.');
      return;
    }

    const taskData = {
      agency_id: agency?.id || 'age_default_id',
      client_id: newClient,
      assignee_id: newAssignee || null,
      module: newModule,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: newStatus,
      priority: newPriority,
      due_date: newDueDate,
      time_logged_minutes: 0
    };

    const { error } = await supabase.from('tasks').insert(taskData);
    if (!error) {
      window.dispatchEvent(new Event('local_db_change'));
      loadTasks();
      setShowAddModal(false);
      alert('Task created successfully.');
    } else {
      setFormError(error.message || 'Failed to create task.');
    }
  };

  const handleMoveStatus = async (taskId, newStatus) => {
    await supabase.from('tasks').eq('id', taskId).update({ status: newStatus });
    window.dispatchEvent(new Event('local_db_change'));
    loadTasks();
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleQuickAdd = async (colStatus, e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask = {
      agency_id: 'age_default_id',
      client_id: selectedClientId || 'cli_kovai_id',
      module: 'general',
      title: quickTitle.trim(),
      status: colStatus,
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      time_logged_minutes: 0
    };

    await supabase.from('tasks').insert(newTask);
    window.dispatchEvent(new Event('local_db_change'));
    setQuickTitle('');
    setQuickCol(null);
    loadTasks();
  };

  // Start time logger
  const handleStartTimer = () => {
    if (isTimerRunning) return;
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setTimePassed(prev => prev + 1);
    }, 1000);
    setTimerIntervalId(interval);
  };

  // Stop time logger and commit minutes
  const handleStopTimer = async () => {
    if (!isTimerRunning) return;
    setIsTimerRunning(false);
    clearInterval(timerIntervalId);
    setTimerIntervalId(null);
    
    const minutesLogged = Math.ceil(timePassed / 60) || 1;
    const updatedMinutes = (selectedTask.time_logged_minutes || 0) + minutesLogged;

    await supabase.from('tasks').eq('id', selectedTask.id).update({
      time_logged_minutes: updatedMinutes
    });
    
    setSelectedTask(prev => ({ ...prev, time_logged_minutes: updatedMinutes }));
    setTimePassed(0);
    window.dispatchEvent(new Event('local_db_change'));
    loadTasks();
    alert(`Logged ${minutesLogged} minutes to task.`);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-error-red';
      case 'high': return 'bg-warning-amber';
      case 'medium': return 'bg-primary-cyan';
      default: return 'bg-text-muted';
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'review', title: 'Review Needed' },
    { id: 'done', title: 'Completed' }
  ];

  return (
    <div className="space-y-6 font-sans animate-fade-in select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-sm font-mono uppercase font-bold text-text-primary">Operational Tasks Board</h2>
          <p className="text-xs text-text-secondary">Manage and track day-to-day services workflows.</p>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer shadow transition-colors"
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Kanban Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start h-[480px]">
        
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-page-bg/40 border border-border-light rounded p-3 flex flex-col max-h-full h-full">
              {/* Header column title */}
              <div className="flex justify-between items-center border-b border-border-light pb-2 mb-3">
                <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
                  {col.title} ({colTasks.length})
                </span>
                <button 
                  onClick={() => {
                    setQuickCol(col.id);
                    setQuickTitle('');
                  }}
                  className="p-1 hover:bg-panel-white text-text-muted hover:text-text-primary rounded cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Quick Add input */}
              {quickCol === col.id && (
                <form onSubmit={(e) => handleQuickAdd(col.id, e)} className="mb-3 space-y-2">
                  <input 
                    type="text" 
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    placeholder="Task name..."
                    className="w-full border border-border-light rounded px-2.5 py-1 text-xs"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setQuickCol(null)} className="px-2 py-0.5 border border-border-light rounded text-[10px] text-text-secondary">Cancel</button>
                    <button type="submit" className="px-2 py-0.5 bg-primary-cyan text-white rounded text-[10px] font-semibold">Add</button>
                  </div>
                </form>
              )}

              {/* Task list container */}
              <div className="space-y-3 overflow-y-auto flex-1 pb-12 scrollbar-thin">
                {colTasks.map(task => {
                  const client = clients.find(c => c.id === task.client_id);
                  return (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-panel-white border border-border-light hover:border-primary-cyan rounded p-3 shadow-sm cursor-pointer transition-all duration-150 space-y-2 relative group"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-text-primary text-[11px] leading-tight block truncate max-w-[80%]">
                          {task.title}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-mono text-text-secondary leading-none">
                        <span className="uppercase">{task.module}</span>
                        {client && <span className="text-text-muted truncate max-w-[100px]">{client.name}</span>}
                      </div>

                      {/* Drag / Move Helper triggers (visible on hover) */}
                      <div className="hidden group-hover:flex items-center justify-end gap-1.5 border-t border-page-bg pt-2 mt-1">
                        {columns.filter(c => c.id !== col.id).map(c => (
                          <button 
                            key={c.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStatus(task.id, c.id);
                            }}
                            className="bg-page-bg text-text-secondary hover:text-primary-cyan font-mono text-[8px] font-bold px-1 py-0.5 rounded border border-border-light cursor-pointer"
                          >
                            → {c.title.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Side Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-end font-sans">
          <div className="w-96 bg-panel-white h-full border-l border-border-light shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              
              {/* Header drawer */}
              <div className="flex items-center justify-between border-b border-page-bg pb-3">
                <span className="font-mono text-[10px] font-bold text-text-secondary uppercase">
                  TASK DETAILS
                </span>
                <button 
                  onClick={() => {
                    if (isTimerRunning) handleStopTimer();
                    setSelectedTask(null);
                  }}
                  className="text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title & info fields */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Task Title</label>
                  <input 
                    type="text" 
                    value={selectedTask.title} 
                    onChange={e => {
                      const updated = { ...selectedTask, title: e.target.value };
                      setSelectedTask(updated);
                      supabase.from('tasks').eq('id', selectedTask.id).update({ title: e.target.value });
                      window.dispatchEvent(new Event('local_db_change'));
                    }}
                    className="w-full border border-border-light rounded px-2.5 py-1 text-xs" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Priority</label>
                    <select 
                      value={selectedTask.priority} 
                      onChange={e => {
                        setSelectedTask({ ...selectedTask, priority: e.target.value });
                        supabase.from('tasks').eq('id', selectedTask.id).update({ priority: e.target.value });
                        window.dispatchEvent(new Event('local_db_change'));
                        loadTasks();
                      }}
                      className="w-full border border-border-light bg-panel-white rounded px-2 py-1 text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">Module Category</label>
                    <select 
                      value={selectedTask.module} 
                      onChange={e => {
                        setSelectedTask({ ...selectedTask, module: e.target.value });
                        supabase.from('tasks').eq('id', selectedTask.id).update({ module: e.target.value });
                        window.dispatchEvent(new Event('local_db_change'));
                        loadTasks();
                      }}
                      className="w-full border border-border-light bg-panel-white rounded px-2 py-1 text-xs"
                    >
                      <option value="seo">SEO</option>
                      <option value="gbp">GBP</option>
                      <option value="aeo">AEO</option>
                      <option value="social">Social</option>
                      <option value="content">Content</option>
                      <option value="email">Email</option>
                      <option value="reputation">Reputation</option>
                      <option value="geofencing">Geo-fencing</option>
                      <option value="general">General Operations</option>
                    </select>
                  </div>
                </div>

                {/* Billable Time Logger widget */}
                <div className="border border-border-medium rounded bg-dark-panel p-4 text-white space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] text-[#06B6D4] font-bold uppercase">Time Sheets Tracker</span>
                    <span className="font-mono text-[10px] text-text-muted">{selectedTask.time_logged_minutes || 0}m logged</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-text-muted">ACTIVE TIMER</span>
                      <span className="font-mono font-bold text-lg text-primary-cyan">
                        {Math.floor(timePassed / 60).toString().padStart(2, '0')}:{(timePassed % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {!isTimerRunning ? (
                        <button 
                          onClick={handleStartTimer}
                          className="bg-[#06B6D433] border border-[#06B6D466] hover:bg-primary-cyan p-2 rounded text-primary-cyan hover:text-white transition-colors cursor-pointer"
                        >
                          <Play size={14} className="fill-current" />
                        </button>
                      ) : (
                        <button 
                          onClick={handleStopTimer}
                          className="bg-red-500/20 border border-red-500/40 hover:bg-red-500 p-2 rounded text-red-500 hover:text-white transition-colors cursor-pointer"
                        >
                          <Square size={14} className="fill-current" stroke="none" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <button 
              onClick={async () => {
                if (confirm('Delete this task?')) {
                  await supabase.from('tasks').eq('id', selectedTask.id).delete();
                  window.dispatchEvent(new Event('local_db_change'));
                  loadTasks();
                  setSelectedTask(null);
                }
              }}
              className="w-full py-1.5 border border-red-200 text-error-red hover:bg-red-50 text-xs font-semibold rounded cursor-pointer mt-8"
            >
              Delete Task
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-panel-white border border-border-light rounded-lg shadow-2xl p-6 relative select-none font-sans text-xs text-text-primary">
            <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
              <h3 className="text-sm font-semibold text-text-primary uppercase">
                Create Operational Task
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-error-red text-[11px] rounded mb-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                  Task Title *
                </label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Schedule June newsletter"
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                  Description
                </label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details and context..."
                  className="w-full border border-border-light rounded p-2 text-xs h-16 focus:ring-1 focus:ring-primary-cyan outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                    Client *
                  </label>
                  <select 
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs bg-panel-white focus:ring-1 focus:ring-primary-cyan outline-none font-semibold"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                    Assignee
                  </label>
                  <select 
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs bg-panel-white focus:ring-1 focus:ring-primary-cyan outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {teammates.map(t => (
                      <option key={t.id} value={t.id}>{t.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                    Module / Tag
                  </label>
                  <select 
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                    className="w-full border border-border-light rounded px-2 py-1.5 text-xs bg-panel-white focus:ring-1 focus:ring-primary-cyan outline-none"
                  >
                    <option value="general">General</option>
                    <option value="seo">SEO</option>
                    <option value="gbp">GBP</option>
                    <option value="aeo">AEO</option>
                    <option value="social">Social</option>
                    <option value="content">Content</option>
                    <option value="email">Email</option>
                    <option value="reputation">Reputation</option>
                    <option value="analytics">Analytics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                    Priority
                  </label>
                  <select 
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full border border-border-light rounded px-2 py-1.5 text-xs bg-panel-white focus:ring-1 focus:ring-primary-cyan outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                    Board Status
                  </label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-border-light rounded px-2 py-1.5 text-xs bg-panel-white focus:ring-1 focus:ring-primary-cyan outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review Needed</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-mono text-[9px] font-bold text-text-secondary uppercase">
                  Due Date
                </label>
                <input 
                  type="date" 
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full border border-border-light rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary-cyan outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border-light pt-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-border-light rounded text-xs text-text-secondary hover:bg-page-bg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary-cyan hover:bg-primary-cyan-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

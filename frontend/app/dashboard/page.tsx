'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Task } from '../../lib/api';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      const data = await api.getTasks(1, 100, filters.status || undefined, filters.priority || undefined, filters.search || undefined);
      setTasks(data.tasks);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTask(newTask);
      setNewTask({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' });
      fetchTasks();
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await api.updateTask(editingTask.id, editingTask);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.deleteTask(id);
        fetchTasks();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.toggleTaskStatus(id);
      fetchTasks();
    } catch (err) {
      setError('Failed to toggle task status');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Task Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Filters */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleCreateTask} style={{ marginBottom: '2rem' }}>
        <h2>Add New Task</h2>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary">Add Task</button>
      </form>

      {/* Task List */}
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            {editingTask?.id === task.id ? (
              <form onSubmit={handleUpdateTask}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" onClick={() => setEditingTask(null)} className="btn btn-secondary">Cancel</button>
              </form>
            ) : (
              <>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p>Status: {task.status}</p>
                <p>Priority: {task.priority}</p>
                {task.dueDate && <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                <button onClick={() => handleToggleStatus(task.id)} className="btn btn-secondary">
                  {task.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                </button>
                <button onClick={() => setEditingTask(task)} className="btn btn-secondary">Edit</button>
                <button onClick={() => handleDeleteTask(task.id)} className="btn btn-secondary">Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

import express from 'express';
import { prisma } from '../server';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// Get all tasks for the user with pagination, filtering, searching
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, search } = req.query;
    const userId = req.user.id;

    const where: any = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.task.count({ where });

    res.json({ tasks, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: { title, description, status, priority, dueDate: dueDate ? new Date(dueDate) : null, userId },
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update a task
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Toggle task status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findFirst({
      where: { id: Number(id), userId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: { status: newStatus },
    });

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle task status' });
  }
});

export default router;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    const taskId = parseInt(params.id);
    const url = new URL(request.url);
    const isToggle = url.pathname.endsWith('/toggle');

    if (isToggle) {
      // Toggle status
      const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
      });

      return NextResponse.json(updatedTask);
    } else {
      // Regular update
      const { title, description, status, priority, dueDate } = await request.json();

      const task = await prisma.task.updateMany({
        where: { id: taskId, userId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
          ...(priority !== undefined && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        },
      });

      if (task.count === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      const updatedTask = await prisma.task.findUnique({ where: { id: taskId } });
      return NextResponse.json(updatedTask);
    }
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const userId = decoded.id;

    const taskId = parseInt(params.id);

    const task = await prisma.task.deleteMany({
      where: { id: taskId, userId },
    });

    if (task.count === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}

const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const protect = require('../middleware/auth');
const checkProjectRole = require('../middleware/role');

const router = express.Router({ mergeParams: true });

// @route   POST /api/projects/:projectId/tasks
// @desc    Create a new task
// @access  Private (Admin only)
router.post(
  '/',
  protect,
  checkProjectRole('Admin'),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('assignee').optional().isMongoId().withMessage('Invalid assignee ID'),
    body('status')
      .optional()
      .isIn(['To Do', 'In Progress', 'Done'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['Low', 'Medium', 'High'])
      .withMessage('Invalid priority'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { title, description, assignee, status, priority, dueDate } =
        req.body;

      // Validate assignee is a project member
      if (assignee) {
        const isMember = req.project.members.some(
          (m) => m.user.toString() === assignee
        );
        if (!isMember) {
          return res.status(400).json({
            success: false,
            message: 'Assignee must be a project member',
          });
        }
      }

      const task = await Task.create({
        title,
        description: description || '',
        project: req.params.projectId,
        assignee: assignee || null,
        status: status || 'To Do',
        priority: priority || 'Medium',
        dueDate: dueDate || null,
        createdBy: req.user._id,
      });

      await task.populate('assignee', 'name email');
      await task.populate('createdBy', 'name email');

      res.status(201).json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error creating task',
      });
    }
  }
);

// @route   GET /api/projects/:projectId/tasks
// @desc    Get all tasks for a project (with optional filters)
// @access  Private (project member)
router.get(
  '/',
  protect,
  checkProjectRole('Member'),
  async (req, res) => {
    try {
      const { status, priority, assignee, search } = req.query;
      const filter = { project: req.params.projectId };

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assignee) filter.assignee = assignee;
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      const tasks = await Task.find(filter)
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: tasks });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error fetching tasks',
      });
    }
  }
);

// @route   GET /api/projects/:projectId/tasks/:id
// @desc    Get a single task
// @access  Private (project member)
router.get(
  '/:id',
  protect,
  checkProjectRole('Member'),
  async (req, res) => {
    try {
      const task = await Task.findOne({
        _id: req.params.id,
        project: req.params.projectId,
      })
        .populate('assignee', 'name email')
        .populate('createdBy', 'name email');

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      res.json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error fetching task',
      });
    }
  }
);

// @route   PUT /api/projects/:projectId/tasks/:id
// @desc    Update a task
// @access  Private (Admin: full edit, Member: status only for assigned tasks)
router.put(
  '/:id',
  protect,
  checkProjectRole('Member'),
  async (req, res) => {
    try {
      const task = await Task.findOne({
        _id: req.params.id,
        project: req.params.projectId,
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      // Members can only update status of tasks assigned to them
      if (req.userRole === 'Member') {
        if (
          !task.assignee ||
          task.assignee.toString() !== req.user._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'Members can only update their own assigned tasks',
          });
        }

        // Only allow status change for members
        if (req.body.status) {
          task.status = req.body.status;
        } else {
          return res.status(403).json({
            success: false,
            message: 'Members can only update task status',
          });
        }
      } else {
        // Admin can update everything
        const { title, description, assignee, status, priority, dueDate } =
          req.body;

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (assignee !== undefined) {
          if (assignee) {
            const isMember = req.project.members.some(
              (m) => m.user.toString() === assignee
            );
            if (!isMember) {
              return res.status(400).json({
                success: false,
                message: 'Assignee must be a project member',
              });
            }
          }
          task.assignee = assignee || null;
        }
      }

      await task.save();
      await task.populate('assignee', 'name email');
      await task.populate('createdBy', 'name email');

      res.json({ success: true, data: task });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error updating task',
      });
    }
  }
);

// @route   DELETE /api/projects/:projectId/tasks/:id
// @desc    Delete a task
// @access  Private (Admin only)
router.delete(
  '/:id',
  protect,
  checkProjectRole('Admin'),
  async (req, res) => {
    try {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        project: req.params.projectId,
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found',
        });
      }

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error deleting task',
      });
    }
  }
);

module.exports = router;

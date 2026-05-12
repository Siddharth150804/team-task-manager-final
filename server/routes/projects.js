const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const protect = require('../middleware/auth');
const checkProjectRole = require('../middleware/role');

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
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

      const { name, description } = req.body;

      const project = await Project.create({
        name,
        description: description || '',
        owner: req.user._id,
        members: [{ user: req.user._id, role: 'Admin' }],
      });

      await project.populate('members.user', 'name email');

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error creating project',
      });
    }
  }
);

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id,
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort({ createdAt: -1 });

    // Add task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const counts = {
          total: 0,
          'To Do': 0,
          'In Progress': 0,
          Done: 0,
        };

        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return {
          ...project.toObject(),
          taskCounts: counts,
        };
      })
    );

    res.json({ success: true, data: projectsWithCounts });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching projects',
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get a single project
// @access  Private (project member)
router.get('/:id', protect, checkProjectRole('Member'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.json({
      success: true,
      data: { ...project.toObject(), userRole: req.userRole },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching project',
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private (Admin only)
router.put(
  '/:id',
  protect,
  checkProjectRole('Admin'),
  [
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Project name cannot be empty'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const update = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;

      const project = await Project.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      })
        .populate('owner', 'name email')
        .populate('members.user', 'name email');

      res.json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error updating project',
      });
    }
  }
);

// @route   DELETE /api/projects/:id
// @desc    Delete a project and all its tasks
// @access  Private (Admin only)
router.delete(
  '/:id',
  protect,
  checkProjectRole('Admin'),
  async (req, res) => {
    try {
      await Task.deleteMany({ project: req.params.id });
      await Project.findByIdAndDelete(req.params.id);

      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error deleting project',
      });
    }
  }
);

// @route   POST /api/projects/:id/members
// @desc    Add a member to the project
// @access  Private (Admin only)
router.post(
  '/:id/members',
  protect,
  checkProjectRole('Admin'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn(['Admin', 'Member'])
      .withMessage('Role must be Admin or Member'),
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

      const { email, role = 'Member' } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No user found with this email',
        });
      }

      // Check if already a member
      const project = req.project;
      const existingMember = project.members.find(
        (m) => m.user.toString() === user._id.toString()
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this project',
        });
      }

      project.members.push({ user: user._id, role });
      await project.save();

      const updatedProject = await Project.findById(project._id)
        .populate('owner', 'name email')
        .populate('members.user', 'name email');

      res.json({ success: true, data: updatedProject });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error adding member',
      });
    }
  }
);

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove a member from the project
// @access  Private (Admin only)
router.delete(
  '/:id/members/:userId',
  protect,
  checkProjectRole('Admin'),
  async (req, res) => {
    try {
      const project = req.project;
      const userId = req.params.userId;

      // Cannot remove the owner
      if (project.owner.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the project owner',
        });
      }

      project.members = project.members.filter(
        (m) => m.user.toString() !== userId
      );
      await project.save();

      // Unassign tasks from removed member
      await Task.updateMany(
        { project: project._id, assignee: userId },
        { assignee: null }
      );

      const updatedProject = await Project.findById(project._id)
        .populate('owner', 'name email')
        .populate('members.user', 'name email');

      res.json({ success: true, data: updatedProject });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error removing member',
      });
    }
  }
);

module.exports = router;

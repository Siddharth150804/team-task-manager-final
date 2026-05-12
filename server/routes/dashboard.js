const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const protect = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get aggregated dashboard stats for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Get all projects the user is a member of
    const projects = await Project.find({
      'members.user': req.user._id,
    }).select('_id name');

    const projectIds = projects.map((p) => p._id);

    // Get all tasks across user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', 'name email')
      .populate('project', 'name');

    // Tasks assigned to current user
    const myTasks = allTasks.filter(
      (t) => t.assignee && t.assignee._id.toString() === req.user._id.toString()
    );

    // Overdue tasks (due date has passed, task not Done)
    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
    );

    // Status counts
    const statusCounts = {
      'To Do': allTasks.filter((t) => t.status === 'To Do').length,
      'In Progress': allTasks.filter((t) => t.status === 'In Progress').length,
      Done: allTasks.filter((t) => t.status === 'Done').length,
    };

    // Priority counts
    const priorityCounts = {
      High: allTasks.filter((t) => t.priority === 'High').length,
      Medium: allTasks.filter((t) => t.priority === 'Medium').length,
      Low: allTasks.filter((t) => t.priority === 'Low').length,
    };

    // Recent tasks (last 5)
    const recentTasks = allTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        myTasks: myTasks.length,
        overdueTasks: overdueTasks.length,
        statusCounts,
        priorityCounts,
        recentTasks,
        overdueTasksList: overdueTasks.slice(0, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
    });
  }
});

module.exports = router;

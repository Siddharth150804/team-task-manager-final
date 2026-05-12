const Project = require('../models/Project');

/**
 * Middleware to check if user is a member of the project
 * and optionally enforce a minimum role.
 *
 * @param {string} requiredRole - 'Admin' or 'Member' (minimum role required)
 */
const checkProjectRole = (requiredRole = 'Member') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required',
        });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      // Check if user is the owner (owners always have Admin access)
      if (project.owner.toString() === req.user._id.toString()) {
        req.project = project;
        req.userRole = 'Admin';
        return next();
      }

      // Check membership
      const membership = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project',
        });
      }

      // Check role hierarchy
      if (requiredRole === 'Admin' && membership.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required for this action',
        });
      }

      req.project = project;
      req.userRole = membership.role;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error checking project role',
      });
    }
  };
};

module.exports = checkProjectRole;

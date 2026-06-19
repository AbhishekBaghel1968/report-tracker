/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user has one of the required roles.
 * @param {...string} allowedRoles
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }
    
    next();
  };
}

module.exports = authorizeRoles;

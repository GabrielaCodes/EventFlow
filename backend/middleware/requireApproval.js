export const requireApproval = (req, res, next) => {
  // 1. Ensure user exists (authenticate middleware ran first)
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Check Status for Employees
  if (req.user.role === 'employee' && req.user.verification_status !== 'verified') {
    return res.status(403).json({ 
      error: "Account Pending", 
      message: "Your account is waiting for manager approval." 
    });
  }

  // 3. Allow Managers, Clients, and Verified Employees
  next();
};
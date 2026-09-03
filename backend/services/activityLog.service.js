// activityLog service: small helper to record audit entries on key actions.
import { ActivityLogModel as ActivityLog } from '../models/ActivityLogModel.js'

export const logActivity = async ({ req, action, entityType, entityId, meta, actor, institution }) => {
  try {
    await ActivityLog.create({
      actor: actor || req.user?._id,
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      institution: institution || req.user?.institution,
      meta,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })
  } catch {
    // Audit logging must never break the primary request
  }
}

const { AuditLog } = require("../models");

async function record({ actor, action, targetType, targetId, organization, society, status = "success", metadata = {}, req }) {
  try {
    await AuditLog.create({
      actor: actor || null,
      action,
      targetType: targetType || null,
      targetId: targetId || null,
      organization: organization || null,
      society: society || null,
      status,
      metadata,
      ip: req?.ip || null,
      userAgent: req?.headers?.["user-agent"] || null,
    });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    console.error("[audit] failed to record entry", err);
  }
}

module.exports = { record };

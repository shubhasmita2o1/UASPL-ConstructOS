const { Organization, Society, Project, UserRole } = require("../models");

/**
 * Best-effort recount of denormalized Organization counters.
 * Never throws into the primary request flow.
 */
async function refreshOrganizationCounters(organizationId) {
  if (!organizationId) return;
  try {
    const [societies, projects, members] = await Promise.all([
      Society.countDocuments({ organization: organizationId }),
      Project.countDocuments({ organization: organizationId }),
      UserRole.distinct("user", { organization: organizationId, isActive: true }).then((ids) => ids.length),
    ]);
    await Organization.findByIdAndUpdate(organizationId, {
      $set: { societies, projects, members },
    });
  } catch (err) {
    console.error("[organizationStats] failed to refresh counters", organizationId, err.message);
  }
}

async function bumpCounter(organizationId, field, delta) {
  if (!organizationId || !field || !delta) return;
  try {
    await Organization.findByIdAndUpdate(organizationId, { $inc: { [field]: delta } });
  } catch (err) {
    console.error("[organizationStats] failed to bump", field, organizationId, err.message);
  }
}

module.exports = { refreshOrganizationCounters, bumpCounter };
import AuditLog from '../models/AuditLog.js';

export async function logAuditEvent({
  actor = null,
  actorEmail = '',
  action,
  targetType,
  targetId = null,
  before = null,
  after = null,
  reason = '',
  req = null,
}) {
  try {
    let ip = '127.0.0.1';
    let userAgent = '';

    if (req) {
      const forwarded = req.headers['x-forwarded-for'];
      ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) || req.socket?.remoteAddress || '127.0.0.1';
      userAgent = req.headers['user-agent'] || '';
      if (!actor && req.user) {
        actor = req.user._id;
        actorEmail = req.user.email;
      }
    }

    // Never log password hashes in before or after objects
    const sanitize = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const copy = JSON.parse(JSON.stringify(obj));
      if (copy.password) delete copy.password;
      return copy;
    };

    return await AuditLog.create({
      actor: actor || undefined,
      actorEmail: actorEmail || '',
      action,
      targetType,
      targetId: targetId || undefined,
      before: sanitize(before),
      after: sanitize(after),
      reason: reason || '',
      ip,
      userAgent,
    });
  } catch (err) {
    console.error('Failed to write audit log entry:', err.message);
    return null;
  }
}

// scope helpers: tenant isolation + bounded pagination for list endpoints.
// Every single-object read/mutation must go through scopedOne so a valid
// ObjectId never implies authorization (IDOR/BOLA guard).
import { ApiError } from './ApiError.js';

export const tenantFilter = (req) => ({ institution: req.user.institution });

/** Find one doc by id within the caller's institution. Throws 404 otherwise
 *  (deliberately indistinguishable from not-found to avoid oracle leaks). */
export const scopedOne = async (model, req, id, populate) => {
  let query = model.findOne({ _id: id, institution: req.user.institution });
  if (populate) {
    (Array.isArray(populate) ? populate : [populate]).forEach((p) => {
      query = query.populate(p);
    });
  }
  const doc = await query;
  if (!doc) throw new ApiError(404, `${model.modelName} not found`);
  return doc;
};

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 200;

/** Parse ?page=&limit= with protective caps. Defaults preserve the
 *  historical full-list contract for realistic tenant sizes. */
export const pageParams = (req) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

export const pagedResponse = (res, data, total, { page, limit }) => {
  res.json({
    success: true,
    data,
    pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) }
  });
};

/** Pick an allowlist of fields from req.body (mass-assignment guard). */
export const pick = (obj = {}, keys = []) => {
  const out = {};
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

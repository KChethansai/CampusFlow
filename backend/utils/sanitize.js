// sanitize helpers: untrusted client-supplied strings (URLs, filenames).
import { ApiError } from './ApiError.js';

const URL_RE = /^https?:\/\/[^\s]{1,2048}$/i;

/** Validate a client-supplied URL (avatar/file/resume/attachment links).
 *  Rejects javascript:/data: schemes, path-absolute tricks and overlong input.
 *  Returns undefined for empty input so optional fields stay optional. */
export const cleanUrl = (value, field = 'url') => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !URL_RE.test(value.trim())) {
    throw new ApiError(422, `Invalid ${field}: must be an http(s) URL`);
  }
  return value.trim();
};

/** Validate each entry of a client-supplied URL array (attachments). */
export const cleanUrlArray = (value, field = 'attachments') => {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 10) {
    throw new ApiError(422, `Invalid ${field}: must be an array of at most 10 URLs`);
  }
  return value.map((v) => cleanUrl(v, field));
};

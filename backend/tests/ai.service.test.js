import { jest } from '@jest/globals';

const mockCreate = jest.fn();

// The OpenAI client is constructed lazily per call in ai.service, so a mocked
// module lets us exercise the key-set, success, and failure paths.
jest.unstable_mockModule('openai', () => ({
  default: class MockOpenAI {
    constructor(config) {
      this.config = config;
      this.chat = { completions: { create: mockCreate } };
    }
  }
}));

const { generatePerformanceSummary } = await import('../services/ai.service.js');

const student = { name: 'Test Student' };
const data = { enrollments: 2, attendance: { sessions: 4, present: 3, absent: 1, late: 0 } };

describe('ai.service generatePerformanceSummary', () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    mockCreate.mockReset();
  });

  it('returns a placeholder when no OPENAI_API_KEY is set', async () => {
    const result = await generatePerformanceSummary(student, data);
    expect(result.provider).toBe('none');
    expect(result.summary).toContain('OPENAI_API_KEY');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.snapshotHash).toHaveLength(16);
  });

  it('calls OpenAI and returns the model summary when a key is set', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'Strong performer.' } }] });

    const result = await generatePerformanceSummary(student, data);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0].model).toBe('gpt-4o-mini');
    expect(result.summary).toBe('Strong performer.');
    expect(result.provider).toBe('gpt-4o-mini');
    expect(result.snapshotHash).toHaveLength(16);
  });

  it('falls back to a placeholder when the OpenAI call fails', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-key';
    mockCreate.mockRejectedValue(new Error('rate limit exceeded'));

    const result = await generatePerformanceSummary(student, data);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe('none');
    expect(result.summary).toContain('rate limit exceeded');
    expect(result.snapshotHash).toHaveLength(16);
  });
});

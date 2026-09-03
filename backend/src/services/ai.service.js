import OpenAI from 'openai';
import crypto from 'crypto';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export function hashDataSnapshot(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
}

export async function generatePerformanceSummary(student, performanceData) {
  const snapshotHash = hashDataSnapshot(performanceData);

  if (!client) {
    return {
      summary: 'AI service is not configured. Set OPENAI_API_KEY to enable grounded insights.',
      provider: 'none',
      snapshotHash
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an academic assistant that generates grounded performance summaries based strictly on provided student data.'
        },
        {
          role: 'user',
          content: `Generate a concise performance summary for student ${student.name}.\n\nData:\n${JSON.stringify(performanceData, null, 2)}\n\nData snapshot hash: ${snapshotHash}`
        }
      ],
      temperature: 0.3
    });

    return {
      summary: response.choices[0].message.content,
      provider: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      snapshotHash
    };
  } catch (err) {
    throw new Error(`AI generation failed: ${err.message}`);
  }
}
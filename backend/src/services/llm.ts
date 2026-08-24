import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_startup_crash',
  baseURL: 'https://api.groq.com/openai/v1'
});

export interface PreVisitSummary {
  urgency_level: 'Low' | 'Medium' | 'High';
  chief_complaint: string;
  suggested_questions: string[];
}

export interface PostVisitSummary {
  patient_summary: string;
  medication_schedule: string;
  follow_up_steps: string[];
}

async function callWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('LLM call timed out')), ms)
  );
  return Promise.race([promise, timeout]);
}

export async function generatePreVisitSummary(
  symptoms: string
): Promise<PreVisitSummary | { error: true; raw_symptoms: string }> {
  try {
    const prompt = `Analyse these symptoms and return a JSON object with exactly these fields: urgency_level (must be exactly "Low", "Medium", or "High"), chief_complaint (string), and suggested_questions (array of exactly 3 strings for the doctor to ask). Return ONLY valid JSON, no markdown.

Symptoms: ${symptoms}`;

    const completion = await callWithTimeout(
      openai.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      10000
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response');

    const parsed = JSON.parse(content) as PreVisitSummary;
    if (
      !parsed.urgency_level ||
      !parsed.chief_complaint ||
      !Array.isArray(parsed.suggested_questions)
    ) {
      throw new Error('Invalid JSON structure from LLM');
    }
    return parsed;
  } catch (err) {
    console.error('[LLM] Pre-visit summary failed:', err instanceof Error ? err.message : err);
    return { error: true, raw_symptoms: symptoms };
  }
}

export async function generatePostVisitSummary(
  notes: string
): Promise<PostVisitSummary | { error: true; raw_notes: string }> {
  try {
    const prompt = `Convert these clinical notes into a JSON object with exactly these fields: patient_summary (a patient-friendly paragraph), medication_schedule (a clear readable string), follow_up_steps (array of strings). Return ONLY valid JSON, no markdown.

Clinical notes: ${notes}`;

    const completion = await callWithTimeout(
      openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      10000
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response');

    const parsed = JSON.parse(content) as PostVisitSummary;
    if (
      !parsed.patient_summary ||
      !parsed.medication_schedule ||
      !Array.isArray(parsed.follow_up_steps)
    ) {
      throw new Error('Invalid JSON structure from LLM');
    }
    return parsed;
  } catch (err) {
    console.error('[LLM] Post-visit summary failed:', err instanceof Error ? err.message : err);
    return { error: true, raw_notes: notes };
  }
}

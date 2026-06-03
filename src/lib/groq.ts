import Groq from "groq-sdk";

const ai = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAiContent(prompt: string) {
  const response = await ai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0].message.content;
}
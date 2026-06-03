import { generateAiContent } from "@/lib/groq";
import { GenerateSummaryBody } from "@/types/ai.types";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        const body: GenerateSummaryBody = await req.json()

        const { experienceLevel, skills, jobTitle } = body;

        if (!experienceLevel || !skills || !jobTitle) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Missing fields"
            }, { status: 400 })
        }

        const prompt = `
      You are an expert resume writer and ATS optimization specialist.

      Generate a professional, ATS-friendly resume summary based on the details below.

      Job Title: ${jobTitle}
      Skills: ${skills}
      Experience Level: ${experienceLevel}

      STRICT RULES:
      - Return ONLY the resume summary text, nothing else
      - No headings, no labels, no explanations
      - No "Here is your summary:" or similar phrases
      - 3-4 sentences only
      - Use relevant keywords from the job title and skills for ATS optimization
      - Write in first person without using "I"
      - Keep it between 50-80 words
      - Sound confident and professional
      
     `;

        const result = await generateAiContent(prompt)

        const summary = result;

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "Summary created", data: {
                summary
            }
        }, { status: 201 })

    } catch (error) {
        console.log("Error in generate summary api", error)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Somthing went wrong",
            },
            { status: 500 }
        )
    }
}

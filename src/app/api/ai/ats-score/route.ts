import { generateAiContent } from "@/lib/groq";
import { AtsScoreBody, AtsScoreResponse,} from "@/types/ai.types";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        const body: AtsScoreBody = await req.json()

        const { resumeText } = body;

        if (!resumeText) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Missing fields"
            }, { status: 400 })
        }

        const prompt = `
You are an expert ATS (Applicant Tracking System) specialist.

Analyze the following resume and provide an ATS score.

Resume: ${resumeText}

STRICT RULES:
- Return ONLY a valid JSON object, nothing else
- No explanations, no markdown, no backticks
- Return exactly in this format:

{
  "score": 85,
  "suggestions": [
    "Add more relevant keywords",
    "Use more action verbs"
  ],
  "strengths": [
    "Good use of technical skills",
    "Clear work experience"
  ],
  "missing": [
    "No certifications mentioned",
    "No quantifiable achievements"
  ]
}

SCORING RULES:
- Score out of 100
- Check for relevant keywords and technical skills
- Check for action verbs
- Check for quantifiable achievements
- Check for proper sections (Summary, Experience, Skills, Education)
- Check for ATS friendly formatting
`;

        const result = await generateAiContent(prompt);

        let atsScore: AtsScoreResponse;

        try {
            atsScore = JSON.parse(result ?? "");
        } catch (error) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Failed to parse ATS score"
            }, { status: 500 })
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "ATS score generated",
            data: { atsScore }
        }, { status: 200 })

    } catch (error) {
        console.log("Error in ATS score api", error)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        )
    }
}
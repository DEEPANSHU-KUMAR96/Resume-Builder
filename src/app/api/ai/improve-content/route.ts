import { generateAiContent } from "@/lib/groq";
import { ImproveContentBody } from "@/types/ai.types";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        const body: ImproveContentBody = await req.json()

        const { content } = body;

        if (!content) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Missing fields"
            }, { status: 400 })
        }

        const prompt = `
You are an expert resume writer and ATS optimization specialist.

Improve the following resume content to make it more professional and ATS-friendly.

Content: ${content}

STRICT RULES:
- Return ONLY the improved content, nothing else
- No headings, no labels, no explanations
- No "Here is your improved content:" or similar phrases
- Keep the same format as the original content
- If it is a paragraph, return a paragraph
- If it is bullet points, return bullet points starting with "-"
- Use strong action verbs where possible
- Add relevant ATS keywords naturally
- Make it more impactful and quantifiable where possible
- Do not change the meaning of the original content
- Do not use "I" anywhere
- Keep it concise and professional
`;

        const result = await generateAiContent(prompt)

        const improvedContent = result;

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "improvedContent created", data: {
                improvedContent
            }
        }, { status: 201 })

    } catch (error) {
        console.log("Error in improvedContent api", error)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Somthing went wrong",
            },
            { status: 500 }
        )
    }
}

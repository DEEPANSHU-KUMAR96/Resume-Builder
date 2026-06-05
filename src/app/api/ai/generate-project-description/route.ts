import { generateAiContent } from "@/lib/groq";
import { GenerateProjectDescriptionBody, } from "@/types/ai.types";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        const body: GenerateProjectDescriptionBody = await req.json()

        const { experienceLevel, jobTitle, techStack } = body;

        if (!experienceLevel || !jobTitle || !techStack) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Missing fields"
            }, { status: 400 })
        }

        const prompt = `
You are an expert resume writer and ATS optimization specialist.

Generate a professional ATS-friendly project description based on the details below.

Job Title: ${jobTitle}
Tech Stack: ${techStack}
Experience Level: ${experienceLevel}

STRICT RULES:
- Return ONLY the project description, nothing else
- No headings, no labels, no explanations
- No "Here is your description:" or similar phrases
- Write 3-4 bullet points only
- Start each bullet point with a strong action verb (Built, Developed, Implemented, Designed, Integrated, Optimized etc)
- Each bullet point on a new line starting with "-"
- Include technical skills and technologies from the tech stack
- Keep it ATS optimized with relevant keywords
- Do not use "I" anywhere
`;

        const result = await generateAiContent(prompt);

        const description = result;

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "ProjectDescription created",
            data: { description }
        }, { status: 201 });

    } catch (error) {
        console.log("Error in generate projectDescription api", error)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        )
    }
}

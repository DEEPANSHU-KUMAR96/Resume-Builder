import { generateAiContent } from "@/lib/groq";
import { GenerateWorkExperienceBody } from "@/types/ai.types";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        const body: GenerateWorkExperienceBody = await req.json()

        const { experienceLevel, jobRole, techStack, companyName, duration } = body;

        if (experienceLevel === undefined || !jobRole || !techStack || !companyName || !duration) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Missing fields"
            }, { status: 400 })
        }

        const techStackString = techStack.join(", ");

        const prompt = `
You are an expert resume writer and ATS optimization specialist.

Generate a professional ATS-friendly work experience description based on the details below.

Job Title: ${jobRole}
Company Name: ${companyName}
Experience Level: ${experienceLevel} years
Duration: ${duration}
Tech Stack: ${techStackString}

STRICT RULES:
- Return ONLY the work experience description, nothing else
- No headings, no labels, no explanations
- No "Here is your description:" or similar phrases
- Write 4-5 bullet points only
- Start each bullet point with a strong action verb (Built, Developed, Implemented, Designed, Integrated, Optimized, Led, Collaborated etc)
- Each bullet point on a new line starting with "-"
- Include technical skills and technologies from the tech stack
- Mention impact, results or achievements where possible
- Keep it ATS optimized with relevant keywords
- Do not use "I" anywhere
`;

        const result = await generateAiContent(prompt);

        let experienceDescription: string | string[] = result ?? "";

        if (typeof experienceDescription === "string") {
            experienceDescription = experienceDescription
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.startsWith("-"));
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "Experience description created",
            data: { experienceDescription }
        }, { status: 201 });

    } catch (error) {
        console.log("Error in generate experience description api", error)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        )
    }
}
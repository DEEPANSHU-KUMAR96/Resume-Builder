import { generateAiContent } from "@/lib/groq";
import { GenerateSkillsBody } from "@/types/ai.types";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        const body: GenerateSkillsBody = await req.json()

        const { experienceLevel, jobTitle } = body;

        if (!experienceLevel || !jobTitle) {
            return NextResponse.json<ApiResponse>({
                success: false,
                message: "Missing fields"
            }, { status: 400 })
        }

        const prompt = `
You are an expert resume writer and ATS optimization specialist.

Generate a list of technical skills based on the details below.

Job Title: ${jobTitle}
Experience Level: ${experienceLevel}

STRICT RULES:
- Return ONLY a comma separated list of technical skills, nothing else
- No headings, no labels, no explanations
- No "Here are the skills:" or similar phrases
- Only technical skills (programming languages, frameworks, tools, technologies)
- No soft skills like communication, teamwork, leadership etc
- Generate 10-15 relevant technical skills
- Skills should be ATS optimized and industry relevant
`;

        const result = await generateAiContent(prompt);

        let skills: string | string[] = result ?? "";

        if (typeof skills === "string") {
            skills = skills.split(",").map((skill) => skill.trim());
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: "Skills created",
            data: { skills }
        }, { status: 201 });

    } catch (error) {
        console.log("Error in generate skills api", error)
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        )
    }
}

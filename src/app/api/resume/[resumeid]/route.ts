import { getCurrentUser } from "@/lib/getCurrentUser";
import { connectToDB } from "@/lib/mongodb";
import ResumeModel from "@/models/Resume.model";
import { ApiResponse } from "@/types/api.types";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, { params }: { params: Promise<{ resumeid: string }> }) {
    try {
        await connectToDB()

        const user = await getCurrentUser();

        const { resumeid } = await params;
 
        const resume = await ResumeModel.findById(resumeid)

        if (!resume) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    message: "resume not found"
                },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Resume fetched successfully",
                data: resume
            },
            { status: 200 }
        )

    } catch (error) {

        console.error("Error in get resume api", error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Error in get resume api"
            },
            { status: 500 }
        )
    }
}



export async function PATCH(req: NextRequest, { params }: { params: Promise<{ resumeid: string }> }) {
    try {
        await connectToDB()

        const user = await getCurrentUser();

        const body = await req.json()

        const { resumeid } = await params;

        const updatedResume = await ResumeModel.findByIdAndUpdate({
            _id: resumeid,
            user_id: user
        }, {
            $set: body
        }, {
            new: true,
            runValidators: true
        })

        if (!updatedResume) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    message: "updated resume failed to update"
                },
                { status: 400 }
            )
        }

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Resume updated successfully",
                data: updatedResume
            },
            { status: 200 }
        )

    } catch (error) {

        console.error("Error in get updated resume api", error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Error in get updated resume api"
            },
            { status: 500 }
        )
    }
}


export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resumeid: string }> }) {
    try {
        await connectToDB()

        const userId = await getCurrentUser();

        const { resumeid } = await params;

        const deletedResume = await ResumeModel.findOneAndDelete({
            _id: resumeid,
            user_id: userId
        })

        if (!deletedResume) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    message: "Resume not found"
                },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: "Resume deleted successfully",
            },
            { status: 200 }
        )

    } catch (error) {

        console.error("Error in delete resume api", error);
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                message: "Error in delete resume api"
            },
            { status: 500 }
        )
    }
}


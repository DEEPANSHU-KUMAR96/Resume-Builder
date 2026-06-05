import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({
        success: true,
        message: "Logged out successfully"
    });

    // Clear the token cookie by setting it to an expired date
    response.cookies.set("token", "", {
        httpOnly: true,
        expires: new Date(0),
        sameSite: "lax",
        path: '/'
    });

    return response;
}

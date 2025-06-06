import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { connectDB, User } from "@/utils/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId } = await params;

    const user = await User.findById(userId)
      .populate("following", "name imageUrl _id")
      .exec();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the requesting user can view this information
    const canView =
      userId === session.user.id || // Own profile
      user.followers.some(
        (follower: { _id: { toString(): string } }) =>
          follower._id.toString() === session.user.id
      );

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      following: user.following || [],
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

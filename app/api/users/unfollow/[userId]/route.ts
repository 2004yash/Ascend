import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/options";
import { connectDB, User } from "@/utils/db";

// DELETE /api/users/unfollow/[userId] - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if currently following
    if (!currentUser.following.includes(userId)) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }

    // Remove from following/followers arrays
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: currentUser._id },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

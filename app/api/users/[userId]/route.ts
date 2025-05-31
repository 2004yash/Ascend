import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/options";
import { connectDB, User, Roadmap } from "@/utils/db";

// GET /api/users/[userId] - Get user profile and roadmaps
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    console.log(userId);

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // Find the target user
    const targetUser = await User.findById(userId).select(
      "name imageUrl bio location followers following"
    );

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } // Check if current user follows the target user
    const isFollowing =
      currentUser.following && currentUser.following.includes(userId);
    const isOwnProfile = currentUser._id.equals(targetUser._id);

    // Get roadmaps
    let roadmaps;
    if (isFollowing || isOwnProfile) {
      // Show detailed roadmaps with progress if following or own profile
      roadmaps = await Roadmap.find({ userId })
        .select("title description createdAt sections markdownContent")
        .sort({ lastUpdated: -1 });
    } else {
      // Show only basic roadmap info if not following
      roadmaps = await Roadmap.find({ userId })
        .select("title description createdAt")
        .sort({ lastUpdated: -1 });
    }

    const userProfile = {
      _id: targetUser._id,
      name: targetUser.name,
      imageUrl: targetUser.imageUrl,
      bio: targetUser.bio,
      location: targetUser.location,
      followersCount: targetUser.followers?.length || 0,
      followingCount: targetUser.following?.length || 0,
      roadmaps,
      isFollowing,
      isOwnProfile,
      canViewProgress: isFollowing || isOwnProfile,
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

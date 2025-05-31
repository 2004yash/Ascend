import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { connectDB, User, Roadmap } from "@/utils/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB(); // Get the current user to find who they're following
    const currentUser = await User.findOne({ email: session.user.email })
      .populate("following", "_id")
      .exec();

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    } // Get the IDs of users the current user is following
    const followingIds = currentUser.following.map(
      (user: { _id: string }) => user._id
    );

    // Get recent roadmaps from followed users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await Roadmap.find({
      userId: { $in: followingIds },
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate("userId", "name imageUrl")
      .sort({ createdAt: -1 })
      .limit(20)
      .exec(); // Format the activity data
    const formattedActivity = recentActivity.map(
      (roadmap: {
        _id: string;
        userId: { _id: string; name: string; imageUrl: string };
        title: string;
        description?: string;
        createdAt: string;
      }) => ({
        id: roadmap._id,
        type: "roadmap_created",
        user: {
          id: roadmap.userId._id,
          name: roadmap.userId.name,
          imageUrl: roadmap.userId.imageUrl,
        },
        content: {
          title: roadmap.title,
          description: roadmap.description,
        },
        timestamp: roadmap.createdAt,
        roadmapId: roadmap._id,
      })
    );

    return NextResponse.json({
      activities: formattedActivity,
    });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json(
      { error: "No activity found. Follow someone first." },
      { status: 500 }
    );
  }
}

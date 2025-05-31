import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/options";
import { connectDB, User, Roadmap } from "@/utils/db";

// GET /api/users - Search users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectDB();

    let users;
    if (query) {
      users = await User.find({
        name: { $regex: query, $options: "i" },
        email: { $ne: session.user.email },
      })
        .select("name imageUrl _id")
        .limit(limit);
    } else {
      users = await User.find({
        email: { $ne: session.user.email },
      })
        .select("name imageUrl _id")
        .limit(limit)
        .sort({ _id: -1 });
    }

    const usersWithRoadmaps = await Promise.all(
      users.map(async (user) => {
        const roadmapCount = await Roadmap.countDocuments({ userId: user._id });
        return {
          _id: user._id,
          name: user.name,
          imageUrl: user.imageUrl,
          roadmapCount,
        };
      })
    );

    return NextResponse.json({ users: usersWithRoadmaps });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

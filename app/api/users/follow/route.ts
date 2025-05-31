import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/options";
import { connectDB, User, FollowRequest } from "@/utils/db";

// POST /api/users/follow - Send follow request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }


if (currentUser.following ) {
    // Check if already following
    if (currentUser.following.includes(targetUserId)) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }
}

    // Check if follow request already exists
    const existingRequest = await FollowRequest.findOne({
      from: currentUser._id,
      to: targetUserId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Follow request already sent" },
        { status: 400 }
      );
    }

    // Create follow request
    const followRequest = await FollowRequest.create({
      from: currentUser._id,
      to: targetUserId,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      message: "Follow request sent",
      requestId: followRequest._id,
    });
  } catch (error) {
    console.error("Error sending follow request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/users/follow - Get follow requests (sent and received)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'sent' or 'received'

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let requests;
    if (type === "sent") {
      // Get requests sent by current user
      requests = await FollowRequest.find({
        from: currentUser._id,
        status: "pending",
      })
        .populate("to", "name imageUrl")
        .sort({ createdAt: -1 });
    } else if (type === "received") {
      // Get requests received by current user
      requests = await FollowRequest.find({
        to: currentUser._id,
        status: "pending",
      })
        .populate("from", "name imageUrl")
        .sort({ createdAt: -1 });
    } else {
      return NextResponse.json(
        { error: "Type parameter required (sent/received)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching follow requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { uid, subscription } = await request.json()

    if (!uid || !subscription) {
      return NextResponse.json({ error: "Missing uid or subscription data" }, { status: 400 })
    }

    // Update user's subscription
    await adminDb.collection("users").doc(uid).update({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
      },
    })

    return NextResponse.json({ success: true, message: "Subscription updated" })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}

// GET - Fetch subscription stats
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usersSnapshot = await adminDb.collection("users").get()
    
    const stats = {
      total: 0,
      active: 0,
      trial: 0,
      expired: 0,
      cancelled: 0,
      free: 0,
      basic: 0,
      premium: 0,
      enterprise: 0,
      monthlyRevenue: 0,
    }

    const planPrices = {
      free: 0,
      basic: 499,
      premium: 999,
      enterprise: 2499,
    }

    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      stats.total++
      
      const plan = data.subscription?.plan || "free"
      const status = data.subscription?.status || "active"

      // Count by status
      if (status === "active") stats.active++
      else if (status === "trial") stats.trial++
      else if (status === "expired") stats.expired++
      else if (status === "cancelled") stats.cancelled++

      // Count by plan
      if (plan === "free") stats.free++
      else if (plan === "basic") stats.basic++
      else if (plan === "premium") stats.premium++
      else if (plan === "enterprise") stats.enterprise++

      // Calculate revenue (only active subscriptions)
      if (status === "active") {
        stats.monthlyRevenue += planPrices[plan as keyof typeof planPrices] || 0
      }
    })

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching subscription stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}

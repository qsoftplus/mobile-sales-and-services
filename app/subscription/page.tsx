"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Crown, Sparkles, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/hooks/use-subscription"
import { SUBSCRIPTION_PLANS, PlanId, formatPrice } from "@/lib/subscription-config"
import { ProtectedRoute } from "@/components/protected-route"
import { PageLayout } from "@/components/page-layout"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

function SubscriptionContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { planId: currentPlanId, isActive } = useSubscription()
  const [processingPlan, setProcessingPlan] = useState<PlanId | null>(null)

  const handleSubscribe = async (planId: PlanId) => {
    if (!user) return

    setProcessingPlan(planId)

    try {
      // Simulate Razorpay payment process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Calculate subscription dates
      const startDate = new Date().toISOString()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      // Update user's subscription in Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          subscription: {
            planId,
            status: "active",
            startDate,
            endDate: endDate.toISOString(),
            paymentId: `mock_${Date.now()}`,
          },
        },
        { merge: true }
      )

      toast.success(`Successfully subscribed to ${SUBSCRIPTION_PLANS[planId].name} plan!`, {
        description: "Razorpay integration will be added later. Refreshing...",
      })

      // Reload to refresh user data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Subscription error:", error)
      toast.error("Failed to process subscription. Please try again.")
    } finally {
      setProcessingPlan(null)
    }
  }

  const planIcons: Record<PlanId, typeof Zap> = {
    basic: Zap,
    pro: Sparkles,
    elite: Crown,
  }

  const planColors: Record<PlanId, { bg: string; border: string; badge: string }> = {
    basic: {
      bg: "bg-slate-50",
      border: "border-slate-200",
      badge: "bg-slate-100 text-slate-700",
    },
    pro: {
      bg: "bg-blue-50/50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700",
    },
    elite: {
      bg: "bg-amber-50/50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
    },
  }

  return (
    <div className="flex-1 pb-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Choose Your Plan</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Select the plan that fits your business needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Plan Badge */}
      {isActive && currentPlanId && (
        <div className="flex justify-center mb-8">
          <Badge variant="outline" className="text-sm py-2 px-4 bg-emerald-50 border-emerald-200 text-emerald-700">
            <Check className="w-4 h-4 mr-2" />
            Current Plan: {SUBSCRIPTION_PLANS[currentPlanId].name}
          </Badge>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {(Object.keys(SUBSCRIPTION_PLANS) as PlanId[]).map((planId) => {
          const plan = SUBSCRIPTION_PLANS[planId]
          const Icon = planIcons[planId]
          const colors = planColors[planId]
          const isCurrentPlan = currentPlanId === planId && isActive
          const isProcessing = processingPlan === planId

          return (
            <Card
              key={planId}
              className={`relative overflow-hidden transition-all duration-300 ${colors.bg} ${colors.border} ${
                plan.recommended ? "ring-2 ring-blue-500 shadow-lg scale-105" : "hover:shadow-md"
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-xs font-bold text-center py-1">
                  MOST POPULAR
                </div>
              )}

              <CardHeader className={plan.recommended ? "pt-8" : ""}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${colors.badge}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-slate-600">
                  Perfect for {planId === "basic" ? "getting started" : planId === "pro" ? "growing businesses" : "enterprises"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
                  <span className="text-slate-500">/month</span>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.highlights.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  onClick={() => handleSubscribe(planId)}
                  disabled={isCurrentPlan || !!processingPlan}
                  className={`w-full ${
                    isCurrentPlan
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : plan.recommended
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Features Comparison Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-slate-500">
          All plans include: Inventory Management, Product Listing, Company Page, Profile, and Dashboard.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Razorpay payment integration will be configured. Currently using mock payments.
        </p>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <PageLayout>
        <SubscriptionContent />
      </PageLayout>
    </ProtectedRoute>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  CreditCard,
  TrendingUp,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/features/admin/components/admin-layout"
import { StatCard } from "@/features/admin/components/stat-card"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  newUsersThisYear: number
  loginsThisMonth: number
  loginsThisYear: number
  activeSubscriptions: number
  expiredSubscriptions: number
}

interface MonthlyData {
  month: string
  newUsers: number
  logins: number
}

interface ChartData {
  name: string
  value: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyData[]>([])
  const [roleDistribution, setRoleDistribution] = useState<ChartData[]>([])
  const [planDistribution, setPlanDistribution] = useState<ChartData[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      
      // Fetch stats
      const statsResponse = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data.stats)
        setMonthlyStats(data.monthlyStats || [])
        setRoleDistribution(data.roleDistribution || [])
        setPlanDistribution(data.planDistribution || [])
      }

      // Fetch recent activity
      const activityResponse = await fetch("/api/admin/activity?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (activityResponse.ok) {
        const data = await activityResponse.json()
        setRecentActivity(data.activities || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
    setIsLoading(false)
  }

  const getMaxValue = (data: MonthlyData[], key: keyof MonthlyData) => {
    return Math.max(...data.map((d) => d[key] as number), 1)
  }

  return (
    <AdminLayout
      title="Dashboard"
      description="Overview of your subscription platform metrics"
    >
      {/* Refresh Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          description="All registered users"
          icon={Users}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          description="Logged in last 30 days"
          icon={UserCheck}
          trend={{ value: 12, isPositive: true }}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="New This Month"
          value={stats?.newUsersThisMonth || 0}
          description="Users registered"
          icon={UserPlus}
          iconClassName="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          description="Paid subscribers"
          icon={CreditCard}
          iconClassName="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Logins This Month"
          value={stats?.loginsThisMonth || 0}
          icon={Activity}
          iconClassName="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          title="Logins This Year"
          value={stats?.loginsThisYear || 0}
          icon={TrendingUp}
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="New Users This Year"
          value={stats?.newUsersThisYear || 0}
          icon={Calendar}
          iconClassName="bg-pink-50 text-pink-600"
        />
        <StatCard
          title="Expired Subscriptions"
          value={stats?.expiredSubscriptions || 0}
          icon={Clock}
          iconClassName="bg-red-50 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly User Growth Chart */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              User Growth (Last 12 Months)
            </CardTitle>
            <CardDescription className="text-slate-500">
              New user registrations over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end gap-2">
              {monthlyStats.map((data, index) => {
                const maxUsers = getMaxValue(monthlyStats, "newUsers")
                const height = (data.newUsers / maxUsers) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all hover:from-indigo-400 hover:to-purple-400 opacity-90 hover:opacity-100"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${data.newUsers} new users`}
                    />
                    <span className="text-xs text-slate-500 transform -rotate-45 origin-top-left">
                      {data.month}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => router.push("/admin/users")}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manage Users
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => router.push("/admin/activity")}
            >
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                View Activity
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => router.push("/admin/subscriptions")}
            >
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscriptions
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Role Distribution */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 text-lg">User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleDistribution.map((item) => {
                const total = roleDistribution.reduce((acc, i) => acc + i.value, 0) || 1
                const percentage = Math.round((item.value / total) * 100)
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="text-slate-500">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.name === "Admins"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-gradient-to-r from-blue-500 to-cyan-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 text-lg">Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planDistribution.map((item) => {
                const total = planDistribution.reduce((acc, i) => acc + i.value, 0) || 1
                const percentage = Math.round((item.value / total) * 100)
                const colors: Record<string, string> = {
                  Free: "from-slate-500 to-slate-400",
                  Basic: "from-blue-500 to-blue-400",
                  Premium: "from-purple-500 to-purple-400",
                  Enterprise: "from-amber-500 to-amber-400",
                }
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.name}</span>
                      <span className="text-slate-500">{item.value} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors[item.name] || colors.Free}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Recent Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-slate-900 font-medium">{activity.userName}</p>
                      <p className="text-xs text-slate-500">{activity.userEmail}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        activity.action === "login"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : "border-slate-200 text-slate-600 bg-white"
                      }`}
                    >
                      {activity.action}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

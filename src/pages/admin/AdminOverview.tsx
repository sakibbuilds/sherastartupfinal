import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Rocket, 
  Video, 
  TrendingUp,
  MapPin,
  Smartphone,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStartups: 0,
    totalPitches: 0,
    totalMatches: 0
  });
  const [userDistribution, setUserDistribution] = useState<any[]>([]);
  const [universityStats, setUniversityStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Parallel fetching with separate error handling
      const { count: usersCount, data: users } = await supabase.from('profiles').select('user_type, university_id', { count: 'exact' });
      const { count: startupsCount } = await supabase.from('startups').select('*', { count: 'exact', head: true });
      const { count: pitchesCount } = await supabase.from('video_pitches').select('*', { count: 'exact', head: true });
      const { count: matchesCount } = await supabase.from('matches').select('*', { count: 'exact', head: true });
      const { data: universities } = await supabase.from('universities').select('id, name');

      // Process User Types
      const types = users?.reduce((acc: any, user) => {
        const type = user.user_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const userDistData = Object.entries(types || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));

      // Process Universities
      const uniCounts = users?.reduce((acc: any, user) => {
        if (user.university_id) {
          acc[user.university_id] = (acc[user.university_id] || 0) + 1;
        }
        return acc;
      }, {});

      const uniStatsData = Object.entries(uniCounts || {})
        .map(([id, count]) => ({
          name: universities?.find((u: any) => u.id === id)?.name || 'Unknown',
          users: count
        }))
        .sort((a: any, b: any) => b.users - a.users)
        .slice(0, 5);

      setStats({
        totalUsers: usersCount || 0,
        totalStartups: startupsCount || 0,
        totalPitches: pitchesCount || 0,
        totalMatches: matchesCount || 0
      });
      setUserDistribution(userDistData);
      setUniversityStats(uniStatsData);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Platform analytics and key performance indicators</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalUsers}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Startups</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalStartups}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-sky/20 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-sky" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Video Pitches</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalPitches}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Video className="h-6 w-6 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connections</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalMatches}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {userDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Universities */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Universities</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={universityStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#aaa', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Bar dataKey="users" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mocked Geo/Device Stats (Visual filler as requested) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
              <Globe className="h-24 w-24 text-muted-foreground/20 animate-pulse" />
              <span className="ml-4 text-muted-foreground">Map Visualization Module</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Device Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mobile</span>
                  <span>65%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Desktop</span>
                  <span>30%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-sky w-[30%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tablet</span>
                  <span>5%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 w-[5%]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;

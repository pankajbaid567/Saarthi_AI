import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
} from 'react-native';

type TabKey = 'home' | 'strategy' | 'revision' | 'analytics' | 'profile';
type AuthSession = {
  user: { name: string; email: string };
  accessToken: string;
};

type CommunityPayload = {
  forumsByTopic: Array<{ topicId: string; topicName: string; threads: number; activeUsers: number }>;
};

type StrategyPayload = {
  date: string;
  tasks: Array<{ id: string; title: string; estimatedMinutes: number; completed: boolean; type: string }>;
  summary: { completionPercent: number; weakAreaFocus: string[] };
};

type RevisionPayload = {
  predictedToForget: Array<{ topicId: string; topicName: string; currentRetention: number; alert: 'high' | 'moderate' }>;
  alerts: Array<{ topicId: string; topicName: string; message: string; severity: 'high' | 'moderate' }>;
};

type StreakPayload = { current: number; longest: number; graceDaysRemaining: number };

type AnalyticsPayload = {
  comparativeAnalysis: { topperBaselineScore: number; currentUserScore: number; gapAreas: string[] };
  syllabusFlowPredictedCompletionDate: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api/v1' : 'http://localhost:3001/api/v1');

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

const tabs: Array<{ key: TabKey; label: string; emoji: string }> = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'strategy', label: 'Plan', emoji: '🧭' },
  { key: 'revision', label: 'Revise', emoji: '🧠' },
  { key: 'analytics', label: 'Insights', emoji: '📈' },
  { key: 'profile', label: 'Profile', emoji: '👤' },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('home');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  const [loading, setLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [community, setCommunity] = useState<CommunityPayload | null>(null);
  const [strategy, setStrategy] = useState<StrategyPayload | null>(null);
  const [revision, setRevision] = useState<RevisionPayload | null>(null);
  const [streak, setStreak] = useState<StreakPayload | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  const aspirantTitle = useMemo(() => {
    if (!session?.user.name) return 'Aspirant';
    return session.user.name.split(' ')[0];
  }, [session?.user.name]);

  const loadTabData = async (currentTab: TabKey, accessToken: string) => {
    setLoading(true);
    setScreenError(null);
    try {
      if (currentTab === 'home') {
        const data = await request<CommunityPayload>('/features/community', accessToken);
        setCommunity(data);
      }
      if (currentTab === 'strategy') {
        const data = await request<StrategyPayload>('/strategy/today', accessToken);
        setStrategy(data);
      }
      if (currentTab === 'revision') {
        const [predictionResponse, streakResponse] = await Promise.all([
          request<{ success: boolean; data: RevisionPayload }>('/revision/predictions', accessToken),
          request<{ success: boolean; data: StreakPayload }>('/revision/streaks', accessToken),
        ]);
        setRevision(predictionResponse.data);
        setStreak(streakResponse.data);
      }
      if (currentTab === 'analytics') {
        const data = await request<AnalyticsPayload>('/features/advanced-analytics', accessToken);
        setAnalytics(data);
      }
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void loadTabData(tab, session.accessToken);
  }, [tab, session]);

  const handleLogin = async () => {
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setAuthError('Password must include upper, lower, and number.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Invalid credentials.');
      }
      const data = (await response.json()) as {
        user: { name: string; email: string };
        tokens: { accessToken: string };
      };
      setSession({ user: data.user, accessToken: data.tokens.accessToken });
      setPassword('');
      setTab('home');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.loginRoot}>
        <StatusBar style="light" />
        <View style={styles.loginCard}>
          <Text style={styles.brandTitle}>Saarthi AI Mobile</Text>
          <Text style={styles.brandSubtitle}>UPSC preparation app designed for focused aspirants.</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
          <Pressable
            style={[styles.primaryButton, (!email || !password || authLoading) && styles.disabledButton]}
            disabled={!email || !password || authLoading}
            onPress={handleLogin}
          >
            <Text style={styles.primaryButtonText}>{authLoading ? 'Signing in...' : 'Sign in'}</Text>
          </Pressable>
          <Text style={styles.hintText}>
            Set `EXPO_PUBLIC_API_BASE_URL` if your backend is not on localhost.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMainContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading your aspirant dashboard...</Text>
        </View>
      );
    }

    if (screenError) {
      return <Text style={styles.errorText}>{screenError}</Text>;
    }

    if (tab === 'home') {
      return (
        <>
          <Card title="Today Focus">
            <Text style={styles.bodyText}>Attempt 2 high-yield topics before lunch and finish one revision sprint by evening.</Text>
          </Card>
          <Card title="Community Pulse (V1.1)">
            {community?.forumsByTopic.slice(0, 3).map((forum) => (
              <View key={forum.topicId} style={styles.row}>
                <Text style={styles.rowTitle}>{forum.topicName}</Text>
                <Text style={styles.rowMeta}>{forum.threads} threads · {forum.activeUsers} active</Text>
              </View>
            )) ?? <Text style={styles.bodyText}>No forum data available yet.</Text>}
          </Card>
        </>
      );
    }

    if (tab === 'strategy') {
      return (
        <>
          <Card title="Daily Plan">
            <Text style={styles.bodyText}>Completion: {Math.round(strategy?.summary.completionPercent ?? 0)}%</Text>
            <Text style={styles.bodyText}>Weak area focus: {(strategy?.summary.weakAreaFocus ?? ['core GS']).join(', ')}</Text>
          </Card>
          <Card title="Task Queue">
            {(strategy?.tasks ?? []).slice(0, 6).map((task) => (
              <View key={task.id} style={styles.row}>
                <Text style={styles.rowTitle}>{task.title}</Text>
                <Text style={styles.rowMeta}>{task.estimatedMinutes} min · {task.type}</Text>
              </View>
            ))}
          </Card>
        </>
      );
    }

    if (tab === 'revision') {
      return (
        <>
          <Card title="Retention Alerts">
            {(revision?.predictedToForget ?? []).slice(0, 5).map((topic) => (
              <View key={topic.topicId} style={styles.row}>
                <Text style={styles.rowTitle}>{topic.topicName}</Text>
                <Text style={[styles.rowMeta, { color: topic.alert === 'high' ? '#DC2626' : '#D97706' }]}>
                  {topic.currentRetention}% retention · {topic.alert}
                </Text>
              </View>
            ))}
          </Card>
          <Card title="Streak Momentum">
            <Text style={styles.bodyText}>Current streak: {streak?.current ?? 0} days</Text>
            <Text style={styles.bodyText}>Longest streak: {streak?.longest ?? 0} days</Text>
            <Text style={styles.bodyText}>Grace days left: {streak?.graceDaysRemaining ?? 0}</Text>
          </Card>
        </>
      );
    }

    if (tab === 'analytics') {
      const gap = (analytics?.comparativeAnalysis.topperBaselineScore ?? 0) - (analytics?.comparativeAnalysis.currentUserScore ?? 0);
      return (
        <>
          <Card title="Topper Gap (V1.5)">
            <Text style={styles.bodyText}>Current gap: {gap} points</Text>
            <Text style={styles.bodyText}>
              Focus next: {(analytics?.comparativeAnalysis.gapAreas ?? ['Revision consistency']).join(', ')}
            </Text>
          </Card>
          <Card title="Predicted Milestone">
            <Text style={styles.bodyText}>Syllabus completion ETA: {analytics?.syllabusFlowPredictedCompletionDate ?? 'N/A'}</Text>
          </Card>
        </>
      );
    }

    return (
      <>
        <Card title="Profile">
          <Text style={styles.bodyText}>{session.user.name}</Text>
          <Text style={styles.bodyText}>{session.user.email}</Text>
          <Text style={styles.bodyText}>API: {API_BASE_URL}</Text>
        </Card>
        <Pressable style={styles.secondaryButton} onPress={() => setSession(null)}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.appRoot}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>Hi {aspirantTitle} 👋</Text>
        <Text style={styles.headerSubtext}>Stay consistent. One focused block at a time.</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderMainContent()}
      </ScrollView>

      <View style={styles.tabBar}>
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <Pressable key={item.key} style={styles.tabButton} onPress={() => setTab(item.key)}>
              <Text style={[styles.tabEmoji, !active && styles.tabInactive]}>{item.emoji}</Text>
              <Text style={[styles.tabLabel, !active && styles.tabInactive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

const BORDER_COLOR: ColorValue = '#E2E8F0';

const styles = StyleSheet.create({
  loginRoot: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 20 },
  loginCard: { borderRadius: 16, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1E293B', padding: 18, gap: 10 },
  brandTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '700' },
  brandSubtitle: { color: '#CBD5E1', fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    backgroundColor: '#0B1220',
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  primaryButton: { borderRadius: 10, backgroundColor: '#2563EB', paddingVertical: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#EFF6FF', fontWeight: '700' },
  hintText: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  appRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#0F172A', paddingHorizontal: 18, paddingVertical: 16 },
  headerGreeting: { color: '#F8FAFC', fontSize: 22, fontWeight: '700' },
  headerSubtext: { color: '#CBD5E1', marginTop: 4, fontSize: 13 },
  content: { flex: 1 },
  contentContainer: { padding: 14, gap: 12, paddingBottom: 32 },
  card: { borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 14, backgroundColor: '#FFFFFF', padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardBody: { marginTop: 8, gap: 8 },
  bodyText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  row: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 3 },
  rowTitle: { fontSize: 14, color: '#0F172A', fontWeight: '600' },
  rowMeta: { fontSize: 12, color: '#64748B' },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  loadingText: { color: '#334155', fontSize: 14 },
  errorText: { color: '#DC2626', fontSize: 13, lineHeight: 18 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabButton: { flex: 1, alignItems: 'center', gap: 2 },
  tabEmoji: { fontSize: 16, color: '#1D4ED8' },
  tabLabel: { fontSize: 11, color: '#1D4ED8', fontWeight: '600' },
  tabInactive: { color: '#94A3B8' },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#334155', fontWeight: '700' },
});

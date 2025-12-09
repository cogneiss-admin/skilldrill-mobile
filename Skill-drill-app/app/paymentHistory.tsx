import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import apiService from '../services/api';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  BRAND,
  SCREEN_BACKGROUND
} from './components/Brand';

type PaymentEntry = {
  id: string;
  type: 'SUBSCRIPTION' | 'DRILL_PACK';
  title: string;
  status?: string | null;
  amount: number;
  currency: string;
  date: string;
};

type FilterTab = 'ALL' | 'SUBSCRIPTION' | 'DRILL_PACK';

const STATUS_COLORS: Record<string, string> = {
  successful: '#16A34A',
  failed: '#DC2626',
  pending: '#CA8A04'
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const PaymentHistoryScreen = () => {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await apiService.getPaymentHistory();
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Unable to load payment history.');
        }

        setPayments(res.data);
      } catch (err: any) {
        setError(err.message || 'Unable to load payment history.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => (filter === 'ALL' ? true : p.type === filter))
      .filter((p) => (!q ? true : p.title.toLowerCase().includes(q)));
  }, [payments, filter, query]);

  const renderStatus = (status?: string | null) => {
    if (!status) return null;
    const key = status.toLowerCase();
    const color = STATUS_COLORS[key] || COLORS.text.secondary;
    return (
      <View style={[styles.statusPill, { backgroundColor: `${color}1A` }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusText, { color }]}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: PaymentEntry }) => {
    const dateLabel = formatDate(item.date);
    const amountLabel = formatAmount(item.amount, item.currency);
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
          {renderStatus(item.status)}
        </View>
        <Text style={styles.amount}>{amountLabel}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search transactions"
            placeholderTextColor={COLORS.text.tertiary}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabs}
      >
        {(['ALL', 'SUBSCRIPTION', 'DRILL_PACK'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab === 'ALL' ? 'All' : tab === 'SUBSCRIPTION' ? 'Subscriptions' : 'Drill Packs'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={styles.loaderText}>Loading payment history...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Unable to load history</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/paymentHistory')}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>No transactions</Text>
          <Text style={styles.stateText}>You don’t have any payments yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#D0D0D0',
    paddingBottom: SPACING.padding.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.padding.lg,
    paddingVertical: SPACING.padding.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    zIndex: 10,
  },
  headerRightPlaceholder: {
    width: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: SPACING.padding.lg,
    paddingHorizontal: SPACING.padding.md,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
  },
  searchIcon: {
    marginRight: SPACING.padding.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
  },
  tabs: {
    marginTop: SPACING.padding.md,
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: SPACING.padding.lg,
    gap: SPACING.sm,
  },
  tab: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[100],
  },
  tabActive: {
    backgroundColor: BRAND,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loaderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  stateTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  stateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.sm,
    backgroundColor: BRAND,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  date: {
    ...(TYPOGRAPHY.bodySmall as any),
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  amount: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  statusPill: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...(TYPOGRAPHY.bodySmall as any),
    fontWeight: '700',
  },
});

export default PaymentHistoryScreen;


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type PricingData = {
  finalPrice: number;
  recommendedDrills: number;
  validUntil?: string;
  calculation?: {
    config?: {
      pricingMode?: string;
      pricePerDrill?: number;
      marginType?: string;
      marginValue?: number;
      bufferPercent?: number;
    };
    tokenEstimation?: {
      total?: number;
      totalWithBuffer?: number;
      buffer?: number;
    };
    costCalculation?: {
      baseCost?: number;
      margin?: number;
      costPerDrill?: number;
      totalPrice?: number;
    };
  };
};

interface PricingCardProps {
  pricing: PricingData;
  showDetails?: boolean;
  variant?: 'compact' | 'expanded';
}

const formatPrice = (amount: number, currency: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours <= 0) return 'Expired';
    if (diffHours < 24) return `Valid for ${diffHours}h`;
    return `Valid for ${Math.floor(diffHours / 24)}d`;
  } catch {
    return '';
  }
};

export const PricingCard: React.FC<PricingCardProps> = ({
  pricing,
  showDetails = false,
  variant = 'compact'
}) => {
  const { finalPrice, recommendedDrills, validUntil, calculation } = pricing;
  const validityLabel = formatDate(validUntil);
  const isExpired = validityLabel === 'Expired';
  const priceLabel = formatPrice(finalPrice);
  const pricePerDrill = finalPrice / recommendedDrills;

  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Ionicons name="pricetag" size={18} color="#8B5CF6" />
          <Text style={styles.compactLabel}>Total Price</Text>
        </View>
        <Text style={styles.compactPrice}>{priceLabel}</Text>
        <View style={styles.compactMeta}>
          <Text style={styles.compactMetaText}>
            {formatPrice(pricePerDrill)} per drill • {recommendedDrills} drills
          </Text>
        </View>
        {validUntil && (
          <View style={[styles.validityBadge, isExpired && styles.validityBadgeExpired]}>
            <Ionicons
              name={isExpired ? 'alert-circle' : 'time'}
              size={12}
              color={isExpired ? '#DC2626' : '#059669'}
            />
            <Text style={[styles.validityText, isExpired && styles.validityTextExpired]}>
              {validityLabel}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#8B5CF6', '#6C2BD9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.expandedContainer}
    >
      <View style={styles.expandedHeader}>
        <Ionicons name="pricetag" size={20} color="#FFD700" />
        <Text style={styles.expandedHeaderText}>Pricing Details</Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.expandedPriceLabel}>Total Price</Text>
        <Text style={styles.expandedPrice}>{priceLabel}</Text>
        <Text style={styles.expandedPriceMeta}>
          {formatPrice(pricePerDrill)} per drill
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Drills Included</Text>
          <Text style={styles.detailValue}>{recommendedDrills}</Text>
        </View>

        {validUntil && (
          <View style={styles.detailRow}>
            <View style={styles.detailLabelWithIcon}>
              <Ionicons
                name={isExpired ? 'alert-circle' : 'time'}
                size={14}
                color={isExpired ? '#FCA5A5' : '#86EFAC'}
              />
              <Text style={styles.detailLabel}>Valid Until</Text>
            </View>
            <Text style={[styles.detailValue, isExpired && styles.detailValueExpired]}>
              {validityLabel}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactLabel: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  compactPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6B21A8',
    marginBottom: 4,
  },
  compactMeta: {
    marginTop: 4,
  },
  compactMetaText: {
    fontSize: 13,
    color: '#7C3AED',
    opacity: 0.8,
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  validityBadgeExpired: {
    backgroundColor: '#FEE2E2',
  },
  validityText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  validityTextExpired: {
    color: '#DC2626',
  },
  expandedContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expandedHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#E9D5FF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  expandedPriceLabel: {
    fontSize: 14,
    color: '#E9D5FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  expandedPrice: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  expandedPriceMeta: {
    fontSize: 14,
    color: '#E9D5FF',
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  detailValueExpired: {
    color: '#FCA5A5',
  },
  breakdownSection: {
    gap: 8,
  },
  breakdownTitle: {
    fontSize: 13,
    color: '#E9D5FF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});

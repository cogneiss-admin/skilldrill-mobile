import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, BRAND, BRAND_LIGHT } from './Brand';

export interface ActivityCardProps {
    type: 'assessment' | 'drill';
    data: {
        id: string;
        skillId?: string; // For drill recommendations - needed for subscription screen
        skillName: string;
        // Assessment statuses: NOT_STARTED, IN_PROGRESS, COMPLETED, GENERATING
        // Drill statuses: Unlocked, Pending, Active, Completed, NOT_STARTED (locked)
        status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'GENERATING' | 'Unlocked' | 'Pending' | 'Active' | 'Completed';
        progress?: {
            current: number;
            total: number;
            percentage: number;
        };
        startedAt?: string; // ISO date string - when assessment was started
        assessmentId?: string; // For navigating to results (completed assessments) or linking after purchase
        // Drill-specific fields
        score?: {
            average?: number;
        };
        pricing?: {
            amount: number;
            currency: string;
        };
        drillCount?: number; // Number of drills in the pack (for recommendations)
        jobProgressMessage?: string; // Dynamic message from backend for generating state
    };
    onAction: (action: 'start' | 'resume' | 'view_results' | 'unlock', id: string, assessmentId?: string, skillName?: string) => void;
}

// Helper to format date as "Nov 25, 2025"
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function ActivityCard({ type, data, onAction }: ActivityCardProps) {
    const isAssessment = type === 'assessment';

    const renderAssessmentCard = () => {
        const isCompleted = data.status === 'COMPLETED';
        const isInProgress = data.status === 'IN_PROGRESS';
        const isGenerating = data.status === 'GENERATING';
        const isNotStarted = data.status === 'NOT_STARTED';

        return (
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{data.skillName}</Text>
                </View>

                <View style={styles.content}>
                    {/* Status Badge */}
                    <View style={[
                        styles.badge,
                        isCompleted ? styles.badgeSuccess :
                            isInProgress ? styles.badgeProgress :
                                isGenerating ? styles.badgeGenerating : styles.badgeNotStarted
                    ]}>
                        <View style={[
                            styles.badgeDot,
                            isCompleted ? styles.dotSuccess :
                                isInProgress ? styles.dotProgress :
                                    isGenerating ? styles.dotGenerating : styles.dotNotStarted
                        ]} />
                        <Text style={[
                            styles.badgeText,
                            isCompleted ? styles.textSuccess :
                                isInProgress ? styles.textProgress :
                                    isGenerating ? styles.textGenerating : styles.textNotStarted
                        ]}>
                            {isCompleted ? 'COMPLETED' :
                                isInProgress ? 'IN PROGRESS' :
                                    isGenerating ? 'GENERATING' : 'NOT STARTED'}
                        </Text>
                    </View>


                    {/* Started On (Only for In Progress) */}
                    {isInProgress && data.startedAt && (
                        <Text style={styles.startedOnText}>
                            Started on {formatDate(data.startedAt)}
                        </Text>
                    )}

                    {/* Progress Bar & Question Count (Only for In Progress) */}
                    {isInProgress && data.progress && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarBg}>
                                <LinearGradient
                                    colors={['#0A66C2', '#3B82F6']} // Brand Primary -> Brand Accent
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${data.progress.percentage}%` }]}
                                >
                                    <MotiView
                                        from={{ translateX: -100 }}
                                        animate={{ translateX: 200 }}
                                        transition={{ type: 'timing', duration: 1500, loop: true }}
                                        style={{ width: '50%', height: '100%', position: 'absolute', opacity: 0.3 }}
                                    >
                                        <LinearGradient
                                            colors={['transparent', '#FFFFFF', 'transparent']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{ flex: 1 }}
                                        />
                                    </MotiView>
                                </LinearGradient>
                            </View>
                            <Text style={styles.progressText}>
                                <Text style={styles.progressHighlight}>{data.progress.current}</Text>/<Text style={styles.progressHighlight}>{data.progress.total}</Text> Answered
                            </Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionContainer}>
                        {isCompleted ? (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => onAction('view_results', data.id, data.assessmentId)}
                            >
                                <Text style={styles.primaryButtonText}>See Results</Text>
                            </TouchableOpacity>
                        ) : isInProgress ? (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => onAction('resume', data.id)}
                            >
                                <Text style={styles.primaryButtonText}>Resume Assessment</Text>
                            </TouchableOpacity>
                        ) : isGenerating ? (
                            <TouchableOpacity
                                style={[styles.primaryButton, styles.disabledButton]}
                                disabled={true}
                            >
                                <Ionicons name="hourglass-outline" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>Generating...</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => onAction('start', data.id)}
                            >
                                <Ionicons name="play" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryButtonText}>Start Assessment</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderDrillCard = () => {
        const isLocked = !data.progress && data.status === 'NOT_STARTED'; // Assuming no progress means locked/unpurchased
        const isCompleted = data.status === 'Completed';
        const isUnlocked = data.status === 'Unlocked'; // Purchased but drills not generated yet
        const isPending = data.status === 'Pending'; // Questions generating
        const isActive = data.status === 'Active'; // Drills generated, in progress

        if (isLocked) {
            return (
                <View style={[styles.card, styles.lockedCard]}>
                    <View style={styles.lockedHeader}>
                        <Text style={styles.lockedTitle}>{data.skillName}</Text>
                        <View style={styles.lockIconContainer}>
                            <Ionicons name="lock-closed" size={14} color="#D97706" />
                        </View>
                    </View>

                    <View style={styles.lockedContent}>
                        <Text style={styles.drillCountText}>{data.drillCount} Drills</Text>
                        <Text style={styles.priceText}>${data.pricing?.amount}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.unlockButton}
                        onPress={() => onAction('unlock', data.id, data.assessmentId, data.skillName)}
                    >
                        <Text style={styles.unlockButtonText}>Unlock Drills</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Determine button text and action based on status
        let buttonText = 'Resume Practice';
        let buttonAction: 'start' | 'resume' | 'view_results' | 'unlock' = 'resume';
        let isButtonDisabled = false;
        if (isCompleted) {
            buttonText = 'View Results';
            buttonAction = 'view_results';
        } else if (isUnlocked) {
            buttonText = 'Start Practice';
            buttonAction = 'start';
        } else if (isPending) {
            buttonText = 'Generating...';
            isButtonDisabled = true;
        }

        return (
            <View style={styles.card}>
                <View style={styles.content}>
                    <View style={styles.drillHeader}>
                        <Text style={styles.drillTitle}>{data.skillName}</Text>
                        {/* Status indicator for unlocked drills */}
                        {isUnlocked && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={{ fontSize: 12, color: '#10B981', marginLeft: 4 }}>Ready</Text>
                            </View>
                        )}
                        {/* Status indicator for pending drills */}
                        {isPending && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                                <Ionicons name="hourglass-outline" size={16} color="#D97706" />
                                <Text style={{ fontSize: 12, color: '#D97706', marginLeft: 4 }}>Generating</Text>
                            </View>
                        )}
                    </View>


                    {/* Progress Bar - show for active drills with progress */}
                    {data.progress && !isUnlocked && !isPending && (
                        <View style={styles.progressSection}>
                            <View style={styles.progressBarBg}>
                                <LinearGradient
                                    colors={['#0A66C2', '#3B82F6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBarFill, { width: `${data.progress.percentage}%` }]}
                                >
                                    <MotiView
                                        from={{ translateX: -100 }}
                                        animate={{ translateX: 200 }}
                                        transition={{ type: 'timing', duration: 1500, loop: true }}
                                        style={{ width: '50%', height: '100%', position: 'absolute', opacity: 0.3 }}
                                    >
                                        <LinearGradient
                                            colors={['transparent', '#FFFFFF', 'transparent']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{ flex: 1 }}
                                        />
                                    </MotiView>
                                </LinearGradient>
                            </View>
                            <Text style={styles.progressText}>
                                <Text style={styles.progressHighlight}>{data.progress.current}/{data.progress.total}</Text> drills completed • <Text style={styles.progressHighlight}>{data.progress.percentage}%</Text>
                            </Text>
                        </View>
                    )}

                    {/* Info for unlocked drills */}
                    {isUnlocked && data.progress && (
                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
                            {data.progress.total} personalized drills ready for you
                        </Text>
                    )}

                    {/* Average Score (Only for Completed) */}
                    {isCompleted && data.score && (
                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreLabel}>Average Score: {data.score.average}%</Text>
                        </View>
                    )}

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[
                            isCompleted ? styles.secondaryButtonFull : styles.primaryButton,
                            isButtonDisabled && styles.disabledButton
                        ]}
                        onPress={() => !isButtonDisabled && onAction(buttonAction, data.id)}
                        disabled={isButtonDisabled}
                    >
                        {isPending && <Ionicons name="hourglass-outline" size={16} color={COLORS.white} style={{ marginRight: 8 }} />}
                        <Text style={isCompleted ? styles.secondaryButtonText : styles.primaryButtonText}>
                            {buttonText}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return isAssessment ? renderAssessmentCard() : renderDrillCard();
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.padding.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    header: {
        backgroundColor: '#0056B3', // Dark blue header
        paddingVertical: SPACING.padding.md,
        paddingHorizontal: SPACING.padding.lg,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: SPACING.sm,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.white,
    },
    content: {
        padding: SPACING.padding.lg,
    },
    // Badges
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: BORDER_RADIUS.full,
        marginBottom: SPACING.padding.md,
    },
    badgeSuccess: { backgroundColor: '#DCFCE7' },
    badgeProgress: { backgroundColor: '#F3E8FF' },
    badgeGenerating: { backgroundColor: '#FEF3C7' },
    badgeNotStarted: { backgroundColor: '#FFE4E6' },

    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    dotSuccess: { backgroundColor: '#16A34A' },
    dotProgress: { backgroundColor: '#9333EA' },
    dotGenerating: { backgroundColor: '#D97706' },
    dotNotStarted: { backgroundColor: '#E11D48' },

    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    textSuccess: { color: '#166534' },
    textProgress: { color: '#6B21A8' },
    textGenerating: { color: '#92400E' },
    textNotStarted: { color: '#9F1239' },

    disabledButton: {
        opacity: 0.7,
    },

    startedOnText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
        marginBottom: SPACING.padding.md,
    },

    // Progress Bar
    progressContainer: {
        marginBottom: SPACING.padding.lg,
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#F1F5F9', // Slate 100 
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
        overflow: 'hidden', // Ensure shimmer stays inside
        // Glow Effect
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 3,
    },

    // Buttons
    actionContainer: {
        marginTop: SPACING.padding.xs,
    },
    primaryButton: {
        backgroundColor: '#0056B3',
        paddingVertical: SPACING.padding.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primaryButtonSmall: {
        flex: 1,
        backgroundColor: '#0056B3',
        paddingVertical: SPACING.padding.sm,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        paddingVertical: SPACING.padding.sm,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonFull: {
        backgroundColor: COLORS.white,
        paddingVertical: SPACING.padding.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border.medium,
    },
    secondaryButtonText: {
        color: '#0056B3',
        fontWeight: '600',
        fontSize: TYPOGRAPHY.fontSize.md,
    },

    // Drill Specific Styles
    lockedCard: {
        borderWidth: 2,
        borderColor: '#FCD34D', // Gold border
    },
    lockedHeader: {
        padding: SPACING.padding.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    lockedTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
        flex: 1,
    },
    lockIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedContent: {
        paddingHorizontal: SPACING.padding.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.padding.lg,
    },
    drillCountText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text.secondary,
    },
    priceText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    unlockButton: {
        backgroundColor: '#FBBF24', // Gold button
        margin: SPACING.padding.lg,
        marginTop: 0,
        paddingVertical: SPACING.padding.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    unlockButtonText: {
        color: '#78350F',
        fontWeight: '700',
        fontSize: TYPOGRAPHY.fontSize.md,
    },

    drillHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.padding.md,
    },
    drillTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    progressSection: {
        marginBottom: SPACING.padding.lg,
    },
    progressText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
        marginTop: SPACING.sm,
        fontWeight: '500',
    },
    progressHighlight: {
        color: '#0A66C2', // Brand Color
        fontWeight: '700',
    },
    scoreContainer: {
        marginBottom: SPACING.padding.lg,
    },
    scoreLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.text.secondary,
    },
});

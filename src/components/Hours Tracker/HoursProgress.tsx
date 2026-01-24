import React, { useEffect, useRef } from 'react';
import { BarChart2, CheckCircle2, Rocket, Star, Trophy, Award, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HoursProgressProps {
    totalRequired: number;
    completed: number;
    left: number;
}

interface Badge {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    threshold: number;
    color: string;
    bgColor: string;
    glowColor: string;
}

const HoursProgress: React.FC<HoursProgressProps> = ({
    totalRequired,
    completed,
    left,
}) => {
    const progressPercentage = Math.min((completed / totalRequired) * 100, 100);

    const badges: Badge[] = [
        {
            id: 1,
            title: "First Steps",
            description: "25% Complete",
            icon: Rocket,
            threshold: 25,
            color: "#B8D4FF", // Blue
            bgColor: "from-[#B8D4FF]/30 to-[#B8D4FF]/10",
            glowColor: "shadow-[#B8D4FF]/40"
        },
        {
            id: 2,
            title: "Halfway Hero",
            description: "50% Complete",
            icon: Star,
            threshold: 50,
            color: "#ACC8A2", // Sage
            bgColor: "from-[#ACC8A2]/30 to-[#ACC8A2]/10",
            glowColor: "shadow-[#ACC8A2]/40"
        },
        {
            id: 3,
            title: "Almost There",
            description: "75% Complete",
            icon: Award,
            threshold: 75,
            color: "#FFE68C", // Yellow
            bgColor: "from-[#FFE68C]/30 to-[#FFE68C]/10",
            glowColor: "shadow-[#FFE68C]/40"
        },
        {
            id: 4,
            title: "Goal Crusher",
            description: "100% Complete",
            icon: Trophy,
            threshold: 100,
            color: "#FFB88C", // Peach
            bgColor: "from-[#FFB88C]/30 to-[#FFB88C]/10",
            glowColor: "shadow-[#FFB88C]/40"
        }
    ];

    const isBadgeUnlocked = (threshold: number) => progressPercentage >= threshold;

    const hasMetRequirement = left <= 0;
    const hasCelebratedRef = useRef(false);

    useEffect(() => {
        if (hasMetRequirement && !hasCelebratedRef.current) {
            hasCelebratedRef.current = true;
            confetti({
                particleCount: 180,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#ACC8A2', '#FFB88C', '#FFE68C', '#1a2517']
            });
        } else if (!hasMetRequirement) {
            hasCelebratedRef.current = false;
        }
    }, [hasMetRequirement]);

    return (
        <div className="card glass-card">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
                    <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                    Performance
                </h2>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 sm:mb-10">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3 sm:mb-4">
                    <span className="text-xs font-black text-primary/70 uppercase tracking-[0.2em]">Completion Progress</span>
                    <span
                        className="text-3xl sm:text-4xl md:text-5xl font-black tabular-nums transition-all duration-500 drop-shadow-sm"
                        style={{
                            color: progressPercentage >= 100 ? '#e67e45' : // Deeper Peach/Orange
                                progressPercentage >= 75 ? '#d97706' : // Darker Amber
                                    progressPercentage >= 50 ? '#637a5b' : // Deeper Sage
                                        progressPercentage >= 25 ? '#3b82f6' : '#0d120c', // Deeper Blue
                        }}
                    >
                        {progressPercentage.toFixed(0)}%
                    </span>
                </div>
                <div className="progress-container h-[14px] sm:h-[16px]">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Achievement Badges */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-primary/70 uppercase tracking-[0.15em]">
                        Achievements
                    </h3>
                    <span className="text-xs font-bold text-secondary-sage">
                        {badges.filter(b => isBadgeUnlocked(b.threshold)).length}/{badges.length} Unlocked
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {badges.map((badge) => {
                        const unlocked = isBadgeUnlocked(badge.threshold);
                        const Icon = badge.icon;

                        return (
                            <div
                                key={badge.id}
                                className={`relative rounded-xl p-4 border-2 transition-all duration-500 shadow-sm ${unlocked
                                    ? `bg-gradient-to-br ${badge.bgColor} border-white/50 shadow-md ring-1 ring-black/5 hover:scale-105`
                                    : 'bg-white border-gray-100 opacity-80'
                                    }`}
                            >
                                {/* Lock overlay for locked badges */}
                                {!unlocked && (
                                    <div className="absolute top-2 right-2">
                                        <Lock className="w-3 h-3 text-gray-400" />
                                    </div>
                                )}

                                {/* Badge Icon */}
                                <div className={`flex items-center justify-center mb-3 ${unlocked ? 'animate-bounce-slow' : ''}`}>
                                    <div
                                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${unlocked ? 'shadow-lg border-2 border-white/40' : 'bg-gray-100'
                                            }`}
                                        style={{
                                            backgroundColor: unlocked ? badge.color : undefined,
                                        }}
                                    >
                                        <Icon
                                            className="w-6 h-6 sm:w-7 sm:h-7"
                                            style={{
                                                color: unlocked ? '#fff' : '#cbd5e1',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Badge Info */}
                                <div className="text-center">
                                    <h4
                                        className={`text-xs sm:text-sm font-black mb-1 ${unlocked ? 'text-primary' : 'text-gray-400'
                                            }`}
                                    >
                                        {badge.title}
                                    </h4>
                                    <p
                                        className={`text-[10px] sm:text-xs font-black uppercase tracking-tight ${unlocked ? 'text-primary/70' : 'text-gray-400'
                                            }`}
                                    >
                                        {badge.description}
                                    </p>
                                </div>

                                {/* Unlock animation sparkle */}
                                {unlocked && (
                                    <div className="absolute -top-1 -right-1">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status Message */}
            {left > 0 ? (
                <div className="px-4 sm:px-5 py-3 sm:py-4 bg-primary/5 rounded-2xl border-l-4 border-primary shadow-sm">
                    <p className="text-xs sm:text-sm font-black text-primary flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0"></span>
                        <span className="leading-tight tracking-tight uppercase text-[10px] sm:text-xs">{Math.round(left)} hours remaining to reach goal.</span>
                    </p>
                </div>
            ) : (
                <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#1a2517]/10 to-[#ACC8A2]/10 rounded-2xl border-l-4 border-[#1a2517] shadow-sm">
                    <p className="text-xs sm:text-sm font-black text-[#1a2517] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="leading-tight">Requirement successfully fulfilled!</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default HoursProgress;

export declare function calculateLevel(currentXP: number, currentLevel: number): {
    level: number;
    xp: number;
};
export declare function xpToNextLevel(level: number): number;
export declare function checkNewBadges(oldLevel: number, newLevel: number, gender: 'boy' | 'girl'): Array<{
    level: number;
    emoji: string;
    color: string;
}>;
export declare function checkBattlePass(oldLevel: number, newLevel: number, gender: 'boy' | 'girl'): Array<{
    level: number;
    rewardType: string;
    rewardData: object;
}>;
export declare function getBattlePassProgress(gender: 'boy' | 'girl'): ({
    level: number;
    type: string;
    data: {
        text: string;
        emoji?: undefined;
        name?: undefined;
        value?: undefined;
        options?: undefined;
    };
} | {
    level: number;
    type: string;
    data: {
        emoji: string;
        name: string;
        text?: undefined;
        value?: undefined;
        options?: undefined;
    };
} | {
    level: number;
    type: string;
    data: {
        name: string;
        value: string;
        text?: undefined;
        emoji?: undefined;
        options?: undefined;
    };
} | {
    level: number;
    type: string;
    data: {
        name: string;
        options: string[];
        text?: undefined;
        emoji?: undefined;
        value?: undefined;
    };
})[];
//# sourceMappingURL=gamification.d.ts.map
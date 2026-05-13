export declare function getMyProfile(childId: string): Promise<{
    friendCode: string;
}>;
export declare function sendRequest(senderId: string, friendCode: string): Promise<{
    error: string;
    message: string;
    success?: undefined;
    receiverName?: undefined;
} | {
    success: boolean;
    receiverName: string;
    error?: undefined;
    message?: undefined;
}>;
export declare function getIncomingRequests(childId: string): Promise<{
    requestId: string;
    sender: {
        id: string;
        name: string;
        gender: import(".prisma/client").$Enums.Gender;
        friendCode: string | null;
    };
}[]>;
export declare function acceptRequest(requestId: string, childId: string): Promise<{
    error: string;
    message: string;
    success?: undefined;
} | {
    success: boolean;
    error?: undefined;
    message?: undefined;
}>;
export declare function rejectRequest(requestId: string, childId: string): Promise<{
    error: string;
    message: string;
    success?: undefined;
} | {
    success: boolean;
    error?: undefined;
    message?: undefined;
}>;
export declare function getFriends(childId: string): Promise<{
    id: string;
    name: string;
    gender: import(".prisma/client").$Enums.Gender;
    friendCode: string | null;
    challengeLevel: number;
    level: number;
}[]>;
export declare function removeFriend(childId: string, friendId: string): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=friends.service.d.ts.map
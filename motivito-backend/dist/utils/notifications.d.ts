import { NotificationType } from '@prisma/client';
export declare function sendNotificationToParent(type: NotificationType, parentId: string, payload: any): Promise<void>;
export declare function sendNotificationToChild(type: NotificationType, childId: string, payload: any): Promise<void>;
//# sourceMappingURL=notifications.d.ts.map
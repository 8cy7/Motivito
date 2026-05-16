// PushNotificationDelegate.m
// يتولى توجيه أحداث APNs من iOS إلى مكتبة push-notification-ios
// هذا الملف بالـ Objective-C لأن RNCPushNotificationIOS لا يمكن استدعاؤه مباشرة من Swift

#import <UIKit/UIKit.h>
#import <RNCPushNotificationIOS/RNCPushNotificationIOS.h>

@interface PushNotificationDelegate : NSObject <UIApplicationDelegate>
+ (instancetype)shared;
@end

@implementation PushNotificationDelegate

+ (instancetype)shared {
  static PushNotificationDelegate *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{ instance = [PushNotificationDelegate new]; });
  return instance;
}

+ (void)load {
  // نسجّل الاستماع لأحداث APNs عند تحميل الملف
  [[NSNotificationCenter defaultCenter]
    addObserver:[self shared]
    selector:@selector(didRegister:)
    name:@"APNsDidRegister"
    object:nil];

  [[NSNotificationCenter defaultCenter]
    addObserver:[self shared]
    selector:@selector(didFailRegister:)
    name:@"APNsDidFailRegister"
    object:nil];

  [[NSNotificationCenter defaultCenter]
    addObserver:[self shared]
    selector:@selector(didReceiveRemote:)
    name:@"APNsDidReceiveRemote"
    object:nil];
}

- (void)didRegister:(NSNotification *)notif {
  NSData *token = notif.object;
  if (token) [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:token];
}

- (void)didFailRegister:(NSNotification *)notif {
  NSError *error = notif.object;
  if (error) [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

- (void)didReceiveRemote:(NSNotification *)notif {
  NSDictionary *info = notif.userInfo;
  void (^handler)(UIBackgroundFetchResult) = notif.object;
  if (info && handler) [RNCPushNotificationIOS didReceiveRemoteNotification:info fetchCompletionHandler:handler];
}

@end

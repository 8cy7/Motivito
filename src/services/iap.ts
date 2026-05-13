/**
 * iap.ts
 * ──────
 * Apple In-App Purchase service using react-native-iap v14.
 *
 * SETUP REQUIRED (one-time, in App Store Connect):
 *   1. Go to App Store Connect → Your App → Subscriptions
 *   2. Create a subscription group called "Motivito Pro"
 *   3. Add a subscription with product ID: com.motivito.pro.monthly
 *   4. Set price, duration (1 month), and localizations (Arabic + English)
 *   5. Submit for review along with the app
 *
 * BACKEND REQUIRED:
 *   POST /api/subscriptions/apple-verify  { receiptData: string }
 *   → validates receipt with Apple, updates subscription in DB
 */

import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getReceiptIOS,
  getAvailablePurchases,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { parentApi } from './api';

// ─── Product IDs ──────────────────────────────────────────────────────────────
export const PRODUCT_IDS = {
  MONTHLY: 'com.mmalharbie.motivito.pro.monthly',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

// ─── IAP Manager ─────────────────────────────────────────────────────────────

class IAPManager {
  private purchaseUpdateSub: ReturnType<typeof purchaseUpdatedListener> | null = null;
  private purchaseErrorSub: ReturnType<typeof purchaseErrorListener> | null = null;
  private connected = false;

  async connect(): Promise<void> {
    if (this.connected) return;
    await initConnection();
    this.connected = true;
  }

  disconnect(): void {
    this.purchaseUpdateSub?.remove();
    this.purchaseErrorSub?.remove();
    this.purchaseUpdateSub = null;
    this.purchaseErrorSub = null;
    if (this.connected) {
      endConnection();
      this.connected = false;
    }
  }

  purchase(productId: ProductId, onVerified?: () => Promise<void>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // settled flag — whichever listener fires first wins
      let settled = false;
      const safeResolve = async () => {
        if (!settled) {
          settled = true;
          if (onVerified) await onVerified().catch(() => {});
          resolve();
        }
      };
      const safeReject = (err: any) => { if (!settled) { settled = true; reject(err); } };

      const cleanup = () => {
        this.purchaseUpdateSub?.remove();
        this.purchaseErrorSub?.remove();
        this.purchaseUpdateSub = null;
        this.purchaseErrorSub = null;
      };

      try {
        await this.connect();

        await fetchProducts({ skus: [productId], type: 'subs' }).catch(() => []);

        this.purchaseUpdateSub = purchaseUpdatedListener(
          async (purchase: Purchase) => {
            cleanup();

            try {
              const receipt = await getReceiptIOS();
              if (!receipt) {
                safeReject('لم يتم استلام إيصال الشراء من Apple');
                return;
              }

              await parentApi.post('/api/subscriptions/apple-verify', {
                receiptData: receipt,
                productId: purchase.productId,
                transactionId: purchase.transactionId,
              });

              await finishTransaction({ purchase, isConsumable: false });
              safeResolve();
            } catch (err: any) {
              await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
              safeReject(err?.response?.data?.error || 'فشل التحقق من الاشتراك');
            }
          }
        );

        this.purchaseErrorSub = purchaseErrorListener(async (error: PurchaseError) => {
          const code = (error as any).code;

          if (code === 'E_USER_CANCELLED') {
            cleanup();
            safeReject(null);
          } else if (code === 'already-owned') {
            cleanup();
            try {
              const receipt = await getReceiptIOS();
              if (!receipt) { safeReject(null); return; }
              await parentApi.post('/api/subscriptions/apple-verify', {
                receiptData: receipt,
              });
              safeResolve();
            } catch {
              safeReject(null);
            }
          } else {
            // Ignore transient StoreKit errors if purchase already succeeded
            if (!settled) {
              cleanup();
              safeReject(`${code}: ${(error as any).message}`);
            }
          }
        });

        await requestPurchase({
          request: { apple: { sku: productId } },
          type: 'subs',
        });
      } catch {
        safeReject('تعذّر الاتصال بمتجر التطبيقات، تحقق من الاتصال بالإنترنت');
      }
    });
  }

  async restore(onVerified?: () => Promise<void>): Promise<void> {
    await this.connect();

    const purchases = await getAvailablePurchases();
    if (!purchases || purchases.length === 0) {
      throw new Error('لا توجد مشتريات سابقة لاستعادتها');
    }

    const receipt = await getReceiptIOS();
    if (!receipt) throw new Error('تعذّر الحصول على إيصال Apple');

    await parentApi.post('/api/subscriptions/apple-verify', {
      receiptData: receipt,
      transactionId: purchases[0].transactionId,
    });

    if (onVerified) await onVerified().catch(() => {});
  }
}

export const iapManager = new IAPManager();

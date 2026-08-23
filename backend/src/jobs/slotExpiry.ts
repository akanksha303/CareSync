import cron from 'node-cron';
import { prisma } from '../config/prisma';

export function startSlotExpiryJob(): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const result = await prisma.slot.updateMany({
        where: {
          status: 'HELD',
          held_until: { lt: new Date() },
        },
        data: { status: 'AVAILABLE', held_until: null },
      });
      if (result.count > 0) {
        console.log(`[SlotExpiry] Reverted ${result.count} expired HELD slots to AVAILABLE`);
      }
    } catch (err) {
      console.error('[SlotExpiry] Job failed:', err);
    }
  });
  console.log('[SlotExpiry] Job started — runs every minute');
}

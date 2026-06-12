// 验证 IP 提取逻辑的测试脚本
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./member-private/data/member.db'
    }
  }
});

async function main() {
  console.log('=== Registration Events IP Analysis ===\n');
  
  const events = await prisma.memberRegistrationEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  console.log(`Total events: ${events.length}\n`);
  
  const ipCounts = new Map();
  events.forEach(e => {
    ipCounts.set(e.ip, (ipCounts.get(e.ip) || 0) + 1);
  });
  
  console.log('IP distribution:');
  Array.from(ipCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([ip, count]) => {
      console.log(`  ${ip}: ${count} events`);
    });
  
  console.log('\n=== Recent events ===');
  events.slice(0, 5).forEach(e => {
    console.log(`- ${e.createdAt.toISOString()} | IP: ${e.ip} | Status: ${e.status} | Reason: ${e.reason || 'N/A'}`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
